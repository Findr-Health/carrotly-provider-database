# Quick patch to skip enrichment
import sys

with open('agent.py', 'r') as f:
    content = f.read()

# Fix 1: Replace enrich_provider call
content = content.replace(
    'enriched_provider = self.enricher.enrich_provider(provider)',
    '''if self.enricher:
                    enriched_provider = self.enricher.enrich_provider(provider)
                else:
                    enriched_provider = provider'''
)

# Fix 2: Replace close call
content = content.replace(
    'self.enricher.close()',
    '''if self.enricher:
            self.enricher.close()'''
)

with open('agent.py', 'w') as f:
    f.write(content)

print("✅ Patched agent.py successfully!")
