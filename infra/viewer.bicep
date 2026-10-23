// Reviewable candidate only. Compile is local; deployment requires user approval.
targetScope = 'resourceGroup'

param location string = 'eastus'
param appName string = 'matchpulse-studio'
@description('Empty bootstraps registry/environment only. Supply a pushed sha256 digest for the app phase.')
param imageDigest string = ''

var registryName = 'matchpulse${uniqueString(resourceGroup().id)}'
var pullRoleId = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d')

resource registry 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: registryName
  location: location
  sku: { name: 'Basic' }
  properties: {
    adminUserEnabled: false
    anonymousPullEnabled: false
    publicNetworkAccess: 'Enabled'
  }
}

resource pullIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: '${appName}-pull'
  location: location
}

resource pullRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(registry.id, pullIdentity.id, pullRoleId)
  scope: registry
  properties: {
    roleDefinitionId: pullRoleId
    principalId: pullIdentity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

resource environment 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: '${appName}-env'
  location: location
  properties: {
    appLogsConfiguration: { destination: 'none' }
    workloadProfiles: [
      { name: 'Consumption', workloadProfileType: 'Consumption' }
    ]
  }
}

resource app 'Microsoft.App/containerApps@2024-03-01' = if (!empty(imageDigest)) {
  name: appName
  location: location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: { '${pullIdentity.id}': {} }
  }
  properties: {
    managedEnvironmentId: environment.id
    workloadProfileName: 'Consumption'
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: 8010
        transport: 'auto'
        allowInsecure: false
      }
      registries: [
        { server: registry.properties.loginServer, identity: pullIdentity.id }
      ]
    }
    template: {
      containers: [
        {
          name: 'viewer'
          image: '${registry.properties.loginServer}/matchpulse/viewer@${imageDigest}'
          resources: { cpu: json('0.5'), memory: '1Gi' }
          env: [
            { name: 'MATCHPULSE_ALLOWED_HOSTS', value: '${appName}.${environment.properties.defaultDomain}' }
          ]
          probes: [
            {
              type: 'Startup'
              httpGet: { path: '/api/health', port: 8010, httpHeaders: [{ name: 'Host', value: 'localhost' }] }
              initialDelaySeconds: 5
              periodSeconds: 10
              timeoutSeconds: 3
              failureThreshold: 18
            }
            {
              type: 'Readiness'
              httpGet: { path: '/api/health', port: 8010, httpHeaders: [{ name: 'Host', value: 'localhost' }] }
              periodSeconds: 10
              timeoutSeconds: 3
              failureThreshold: 3
            }
          ]
        }
      ]
      scale: {
        minReplicas: 0
        maxReplicas: 1
        rules: [
          { name: 'http', http: { metadata: { concurrentRequests: '10' } } }
        ]
      }
    }
  }
  dependsOn: [pullRole]
}

output registryLoginServer string = registry.properties.loginServer
output registryResourceName string = registry.name
output containerAppName string = appName
output prospectiveUrl string = 'https://${appName}.${environment.properties.defaultDomain}'
