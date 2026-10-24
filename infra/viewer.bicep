// Protected-trial release only: no registry, identity, paid plan or model resource.
targetScope = 'resourceGroup'

param location string = 'eastus'
param appName string = 'matchpulse-studio'
@description('Audited public GHCR image pinned by its verified sha256 digest; never a mutable tag.')
param image string

resource environment 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: '${appName}-env'
  location: location
  properties: {
    workloadProfiles: [
      { name: 'Consumption', workloadProfileType: 'Consumption' }
    ]
  }
}

resource app 'Microsoft.App/containerApps@2024-03-01' = {
  name: appName
  location: location
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
    }
    template: {
      containers: [
        {
          name: 'viewer'
          image: image
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
}

output containerAppName string = appName
output prospectiveUrl string = 'https://${appName}.${environment.properties.defaultDomain}'
