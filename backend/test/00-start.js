const { expect } = require('supertest');
const { Request } = require('mssql');
const path = require('path');
require('dotenv').config({path: path.resolve('./test/.env')});
const sql = require('../dist/models/db.js');
const req = sql.request;

describe('Prerequisites', function() {
    before(function() {
        assert(process.env.DB_USER, 'missing DB_USER in .env').not.to.be.null;
        expect(process.env.DB_PWD, 'missing DB_PWD in .env').not.to.be.null;
        expect(process.env.DB_NAME, 'missing DB_NAME in .env').not.to.be.null;
        expect(process.env.DB_SERVER, 'missing DB_SERVER in .env').not.to.be.null;
        // expect(process.env.LDAP_DOMAIN, 'missing LDAP_DOMAIN in .env').not.to.be.null;
        // expect(process.env.LDAP_SERVER, 'missing LDAP_SERVER in .env').not.to.be.null;
    });
    
    
    it('should contain a valid database connection', function(done) {
        sql.checkDatabase().then((result) => {
            expect(result).to.be.true;
            done();
        });
    });

});
