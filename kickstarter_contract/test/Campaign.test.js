const assert = require('assert');
const ganache = require('ganache');
const Web3 = require('web3');

const web3 = new Web3(ganache.provider());

const compiledFactory = require('../build/CampaignFactory.json');
const compiledCampaign = require('../build/Campaign.json');

let accounts;
let factory;
let campaignAddress;
let campaign;

beforeEach(async () => {
    accounts = await web3.eth.getAccounts();
    // console.log(JSON.parse(compiledFactory.abi));
    factory = await new web3.eth.Contract(compiledFactory.abi)
                    .deploy({ data: compiledFactory.evm.bytecode.object })
                    .send({ from: accounts[0], gas: '10000000' });

    await factory.methods.createCampaign('100')
                    .send({ from: accounts[0], gas: '10000000' });

    [campaignAddress] = await factory.methods.getDeployedCampaigns().call();

    campaign = await new web3.eth.Contract(
        compiledCampaign.abi,
        campaignAddress
    );
});

describe('Campaigns', () => {
    it('deploys a factory and a campaign', () => {
        assert.ok(factory.options.address);
        assert.ok(campaign.options.address);
    });

    it('marks caller as campaign manager', async () => {
        const manager = await campaign.methods.manager().call();
        assert.equal(accounts[0], manager);
    });

    it('allows people to contribute money and marks them as approvers', async () => {
        await campaign.methods.contribute().send({
            value: '200',
            from: accounts[1]
        });

        const isContributor = await campaign.methods.approvers(accounts[1]);
        assert(isContributor);
    });
});
