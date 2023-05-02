const { network } = require("hardhat")
const {
    developmentChains,
    INITIAL_SUPPLY,
    TOKEN_NAME,
    TOKEN_SYMBOL,
} = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const customToken = await deploy("CustomToken", {
        from: deployer,
        args: [TOKEN_NAME, TOKEN_SYMBOL, INITIAL_SUPPLY],
        log: true,

        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(customToken.address, [INITIAL_SUPPLY])
    }
}

module.exports.tags = ["all", "CustomToken"]
