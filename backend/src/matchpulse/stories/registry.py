"""Only verified immutable claims can enter the registry."""
class ClaimRegistry:
    def __init__(self,index):self.index=index;self.claims={}
    def register(self,claim):
        if not self.index.verify(claim):raise ValueError('Claim failed independent evidence verification')
        if claim.claim_id in self.claims and self.claims[claim.claim_id]!=claim:raise ValueError('Claim ID collision')
        self.claims[claim.claim_id]=claim
        return claim
