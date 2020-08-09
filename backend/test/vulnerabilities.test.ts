import * as request from 'supertest';
import app from '../src/api/app';
import {
  User,
  Domain,
  connectToDatabase,
  Organization,
  Vulnerability
} from '../src/models';
import { createUserToken } from './util';

describe('vulnerabilities', () => {
  beforeAll(async () => {
    await connectToDatabase();
  });
  describe('list', () => {
    it('list by org user should return only domains from that org', async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const domain = await Domain.create({
        name: 'test-' + Math.random(),
        organization
      }).save();
      const vulnerability = await Vulnerability.create({
        title: 'test-' + Math.random(),
        domain
      }).save();
      const domain2 = await Domain.create({
        name: 'test-' + Math.random()
      }).save();
      const vulnerability2 = await Vulnerability.create({
        title: 'test-' + Math.random(),
        domain: domain2
      }).save();
      const response = await request(app)
        .post('/vulnerabilities/search')
        .set(
          'Authorization',
          createUserToken({
            roles: [
              {
                org: organization.id,
                role: 'user'
              }
            ]
          })
        )
        .send({})
        .expect(200);
      expect(response.body.count).toEqual(1);
      expect(response.body.result[0].id).toEqual(vulnerability.id);
    });
    it('list by globalView should return domains from all orgs', async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const domain = await Domain.create({
        name: 'test-' + Math.random(),
        organization
      }).save();
      const title = 'test-' + Math.random();
      const vulnerability = await Vulnerability.create({
        title: title + '-1',
        domain
      }).save();
      const domain2 = await Domain.create({
        name: 'test-' + Math.random()
      }).save();
      const vulnerability2 = await Vulnerability.create({
        title: title + '-2',
        domain: domain2
      }).save();
      const response = await request(app)
        .post('/vulnerabilities/search')
        .set(
          'Authorization',
          createUserToken({
            userType: 'globalView'
          })
        )
        .send({
          filters: { title }
        })
        .expect(200);
      expect(response.body.count).toEqual(2);
    });
    it('list by org user with custom pageSize should work', async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const domain = await Domain.create({
        name: 'test-' + Math.random(),
        organization
      }).save();
      const vulnerability = await Vulnerability.create({
        title: 'test-' + Math.random(),
        domain
      }).save();
      const vulnerability2 = await Vulnerability.create({
        title: 'test-' + Math.random(),
        domain
      }).save();
      const response = await request(app)
        .post('/vulnerabilities/search')
        .set(
          'Authorization',
          createUserToken({
            roles: [
              {
                org: organization.id,
                role: 'user'
              }
            ]
          })
        )
        .send({
          pageSize: 1
        })
        .expect(200);
      expect(response.body.count).toEqual(2);
      expect(response.body.result.length).toEqual(1);
    });
    it('list by org user with pageSize of -1 should return all results', async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const domain = await Domain.create({
        name: 'test-' + Math.random(),
        organization
      }).save();
      const vulnerability = await Vulnerability.create({
        title: 'test-' + Math.random(),
        domain
      }).save();
      const vulnerability2 = await Vulnerability.create({
        title: 'test-' + Math.random(),
        domain
      }).save();
      const response = await request(app)
        .post('/vulnerabilities/search')
        .set(
          'Authorization',
          createUserToken({
            roles: [
              {
                org: organization.id,
                role: 'user'
              }
            ]
          })
        )
        .send({
          pageSize: -1
        })
        .expect(200);
      expect(response.body.count).toEqual(2);
      expect(response.body.result.length).toEqual(2);
    });
  });
  describe('get', () => {
    it("get by org user should work for vulnerability in the user's org", async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const domain = await Domain.create({
        name: 'test-' + Math.random(),
        organization
      }).save();
      const vulnerability = await Vulnerability.create({
        title: 'test-' + Math.random(),
        domain
      }).save();
      const vulnerability2 = await Vulnerability.create({
        title: 'test-' + Math.random(),
        domain
      }).save();
      const response = await request(app)
        .get(`/vulnerabilities/${vulnerability.id}`)
        .set(
          'Authorization',
          createUserToken({
            roles: [
              {
                org: organization.id,
                role: 'user'
              }
            ]
          })
        )
        .expect(200);
      expect(response.body.id).toEqual(vulnerability.id);
    });
    it("get by org user should not work for vulnerability not in the user's org", async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const organization2 = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const domain = await Domain.create({
        name: 'test-' + Math.random(),
        organization: organization2
      }).save();
      const vulnerability = await Vulnerability.create({
        title: 'test-' + Math.random(),
        domain
      }).save();
      const response = await request(app)
        .get(`/vulnerabilities/${vulnerability.id}`)
        .set(
          'Authorization',
          createUserToken({
            roles: [
              {
                org: organization.id,
                role: 'user'
              }
            ]
          })
        )
        .expect(404);
      expect(response.body).toEqual({});
    });
    it('get by globalView should work for any vulnerability', async () => {
      const domain = await Domain.create({
        name: 'test-' + Math.random()
      }).save();
      const vulnerability = await Vulnerability.create({
        title: 'test-' + Math.random(),
        domain
      }).save();
      const response = await request(app)
        .get(`/vulnerabilities/${vulnerability.id}`)
        .set(
          'Authorization',
          createUserToken({
            userType: 'globalView'
          })
        )
        .expect(200);
      expect(response.body.id).toEqual(vulnerability.id);
    });
  });
});
