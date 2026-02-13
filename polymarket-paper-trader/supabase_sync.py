#!/usr/bin/env python3
"""
Supabase Sync Module
Syncs trades to Supabase for live dashboard updates
"""

import os
import logging
from typing import Dict, Optional

logger = logging.getLogger(__name__)


class SupabaseSync:
    """Syncs trades to Supabase database"""
    
    def __init__(self, url: str, key: str, enabled: bool = True):
        self.url = url
        self.key = key
        self.enabled = enabled
        self.client = None
        
        if enabled:
            try:
                from supabase import create_client, Client
                self.client = create_client(url, key)
                logger.info("✓ Supabase client initialized")
            except ImportError:
                logger.warning("Supabase client not installed. Run: pip install supabase")
                self.enabled = False
            except Exception as e:
                logger.error(f"Failed to initialize Supabase: {e}")
                self.enabled = False
    
    def insert_trade(self, trade: Dict) -> bool:
        """Insert a new trade into Supabase"""
        if not self.enabled or not self.client:
            return False
        
        try:
            response = self.client.table("trades").insert(trade).execute()
            logger.info(f"✓ Trade synced to Supabase: {trade['market_id']}")
            return True
        except Exception as e:
            logger.error(f"Failed to insert trade to Supabase: {e}")
            return False
    
    def update_stats(self, stats: Dict) -> bool:
        """Update statistics in Supabase"""
        if not self.enabled or not self.client:
            return False
        
        try:
            # Upsert into stats table (updates or inserts)
            response = self.client.table("stats").upsert({
                "id": 1,  # Always use ID 1 for the single stats record
                **stats
            }).execute()
            logger.info("✓ Stats synced to Supabase")
            return True
        except Exception as e:
            logger.error(f"Failed to update stats to Supabase: {e}")
            return False
    
    def get_stats(self) -> Optional[Dict]:
        """Get current stats from Supabase"""
        if not self.enabled or not self.client:
            return None
        
        try:
            response = self.client.table("stats").select("*").eq("id", 1).single().execute()
            return response.data
        except Exception as e:
            logger.debug(f"Failed to fetch stats: {e}")
            return None
    
    def health_check(self) -> bool:
        """Test Supabase connection"""
        if not self.enabled:
            return False
        
        try:
            self.client.table("trades").select("count", count="exact").execute()
            logger.info("✓ Supabase connection healthy")
            return True
        except Exception as e:
            logger.error(f"Supabase health check failed: {e}")
            return False


def get_supabase_client() -> Optional[SupabaseSync]:
    """Factory function to create Supabase client from environment"""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    
    if not url or not key:
        logger.warning("Supabase credentials not found in environment. Live sync disabled.")
        return SupabaseSync("", "", enabled=False)
    
    return SupabaseSync(url, key, enabled=True)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    print("Testing Supabase connection...")
    sb = get_supabase_client()
    
    if sb.health_check():
        print("✓ Supabase is ready!")
    else:
        print("✗ Supabase connection failed")
        print("\nTo enable live sync:")
        print("1. Create account at supabase.com")
        print("2. Create database tables (see DEPLOYMENT.md)")
        print("3. Set environment variables:")
        print("   export SUPABASE_URL='https://xxx.supabase.co'")
        print("   export SUPABASE_KEY='your-anon-key'")
