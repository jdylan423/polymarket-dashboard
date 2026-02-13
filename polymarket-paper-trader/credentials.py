#!/usr/bin/env python3
"""
Polymarket Credentials Manager
Handles encrypted credential storage and decryption
"""

import subprocess
import os
import logging

logger = logging.getLogger(__name__)


class CredentialsManager:
    """Manage encrypted Polymarket credentials"""
    
    ENCRYPTION_PASSWORD = "polymarket2026"
    ENCRYPTED_DIR = "/Users/penn/.openclaw/workspace/.encrypted"
    
    @staticmethod
    def decrypt_credential(filename: str) -> str:
        """Decrypt a single credential file"""
        filepath = os.path.join(CredentialsManager.ENCRYPTED_DIR, filename)
        
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Credential file not found: {filepath}")
        
        try:
            result = subprocess.run(
                [
                    "openssl", "enc", "-aes-256-cbc", "-d", "-pbkdf2",
                    "-iter", "100000",
                    "-in", filepath,
                    "-pass", f"pass:{CredentialsManager.ENCRYPTION_PASSWORD}"
                ],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if result.returncode != 0:
                raise RuntimeError(f"Decryption failed: {result.stderr}")
            
            return result.stdout.strip()
        
        except subprocess.TimeoutExpired:
            raise RuntimeError("Decryption timeout")
        except Exception as e:
            raise RuntimeError(f"Decryption error: {e}")
    
    @staticmethod
    def get_polymarket_credentials() -> tuple:
        """Get decrypted Polymarket API credentials
        
        Returns:
            (api_key, api_secret, api_passphrase)
        """
        try:
            api_key = CredentialsManager.decrypt_credential("polymarket-apikey.enc")
            api_secret = CredentialsManager.decrypt_credential("polymarket-secret.enc")
            api_passphrase = CredentialsManager.decrypt_credential("polymarket-passphrase.enc")
            
            return api_key, api_secret, api_passphrase
        
        except Exception as e:
            logger.error(f"Failed to load Polymarket credentials: {e}")
            return None, None, None
    
    @staticmethod
    def test_credentials() -> bool:
        """Test if credentials can be decrypted"""
        try:
            api_key, api_secret, api_passphrase = CredentialsManager.get_polymarket_credentials()
            
            if not all([api_key, api_secret, api_passphrase]):
                logger.error("Missing one or more credentials")
                return False
            
            logger.info("✓ Credentials decrypted successfully")
            logger.info(f"  API Key: {api_key[:8]}...{api_key[-8:]}")
            logger.info(f"  Secret: {api_secret[:8]}...{api_secret[-8:]}")
            logger.info(f"  Passphrase: {api_passphrase[:8]}...{api_passphrase[-8:]}")
            
            return True
        
        except Exception as e:
            logger.error(f"Credential test failed: {e}")
            return False


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    print("Testing credential decryption...")
    if CredentialsManager.test_credentials():
        print("✓ All credentials loaded successfully")
    else:
        print("✗ Failed to load credentials")
