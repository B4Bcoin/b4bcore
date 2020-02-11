'use strict';

var should = require('chai').should();
var b4bcore = require('../');

describe('Library', function() {
  it('should export primatives', function() {
    should.exist(b4bcore.crypto);
    should.exist(b4bcore.encoding);
    should.exist(b4bcore.util);
    should.exist(b4bcore.errors);
    should.exist(b4bcore.Address);
    should.exist(b4bcore.Block);
    should.exist(b4bcore.MerkleBlock);
    should.exist(b4bcore.BlockHeader);
    should.exist(b4bcore.HDPrivateKey);
    should.exist(b4bcore.HDPublicKey);
    should.exist(b4bcore.Networks);
    should.exist(b4bcore.Opcode);
    should.exist(b4bcore.PrivateKey);
    should.exist(b4bcore.PublicKey);
    should.exist(b4bcore.Script);
    should.exist(b4bcore.Transaction);
    should.exist(b4bcore.URI);
    should.exist(b4bcore.Unit);
  });
});
