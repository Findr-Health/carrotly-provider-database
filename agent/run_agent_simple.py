#!/usr/bin/env python3
"""
Simple wrapper to run agent without OpenAI enrichment
"""
import os
import sys

# Disable OpenAI by setting invalid key
os.environ['OPENAI_API_KEY'] = 'skip'

# Monkey-patch the ProviderEnricher class to do nothing
import agent

original_init = agent.ProviderEnricher.__init__

def dummy_init(self, api_key):
    self.dummy = True

def dummy_enrich(self, provider):
    return provider

def dummy_close(self):
    pass

agent.ProviderEnricher.__init__ = dummy_init
agent.ProviderEnricher.enrich_provider = dummy_enrich
agent.ProviderEnricher.close = dummy_close

# Now run the original agent
agent.main()
