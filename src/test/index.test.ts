import assert from 'assert';
import extension from '../index';

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
});
