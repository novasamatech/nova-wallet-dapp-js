import assert from 'assert';
import extension from '../index';
import { web3Accounts, web3Enable } from "@polkadot/extension-dapp";

describe('Extension', function() {
  describe('Extension object', function() {
    it('Extension file should return value', function() {
      assert.notEqual(extension, undefined);
    });
  });

  describe('Window object', function() {
    it('Extension should be injected in window', function() {
      assert.notEqual(window.injectedWeb3['@novawallet/extension'], undefined);
    });  
  });

  describe('Dapp functions', function() {
    it('Should return injected extensions', async () => {
      const allInjected = await web3Enable("test dapp");
      console.log(allInjected)
      assert.notEqual(window.injectedWeb3['@novawallet/extension'], undefined);
    });

    it('Should return accounts from extension', async () => {
      const allAccounts = await web3Accounts();
      console.log(allAccounts)
      assert.notEqual(window.injectedWeb3['@novawallet/extension'], undefined);
    });  
  });
});
