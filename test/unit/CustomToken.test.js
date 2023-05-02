const { assert, expect } = require("chai")
const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const {
    developmentChains,
    INITIAL_SUPPLY,
    TOKEN_NAME,
    TOKEN_SYMBOL,
} = require("../../helper-hardhat-config")
const { BigNumber } = require("ethers")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("CustomToken Unit Test", () => {
          let customToken, deployer, user1
          beforeEach(async () => {
              const accounts = await getNamedAccounts()
              deployer = accounts.deployer
              user1 = accounts.user1

              await deployments.fixture("all")
              customToken = await ethers.getContract("CustomToken", deployer)
          })
          it("was deployed", async () => {
              assert(customToken.address)
          })
          describe("contructor", () => {
              it("Should have correct INITIAL_SUPPLY of token", async () => {
                  const totalSupply = await customToken.totalSupply()
                  assert.equal(totalSupply.toString(), INITIAL_SUPPLY)
              })
              it("Initializes the token with the correct name and symbol ", async () => {
                  const name = (await customToken.name()).toString()
                  assert.equal(name, TOKEN_NAME)

                  const symbol = (await customToken.symbol()).toString()
                  assert.equal(symbol, TOKEN_SYMBOL)
              })
          })
          describe("transfers", () => {
              it("Should be able to transfer tokens successfully to an address", async () => {
                  const tokenToSend = ethers.utils.parseEther("10")
                  await customToken.transfer(user1, tokenToSend)
                  expect(await customToken.balanceOf(user1)).to.equal(tokenToSend)
              })
              it("Emit an transfer event when an transfer occurs", async () => {
                  await expect(customToken.transfer(user1, ethers.utils.parseEther("10"))).to.emit(
                      customToken,
                      "Transfer"
                  )
              })
          })
          describe("allowances", () => {
              const amount = ethers.utils.parseEther("20").toString()
              beforeEach(async () => {
                  playerToken = await ethers.getContract("CustomToken", user1)
              })
              it("Should approve other address to spend token", async () => {
                  const tokensToSpend = ethers.utils.parseEther("5")
                  await customToken.approve(user1, tokensToSpend)
                  await playerToken.transferFrom(deployer, user1, tokensToSpend)
                  expect(await playerToken.balanceOf(user1)).to.equal(tokensToSpend)
              })
              it("Does not allow an unapproved member to do transfers", async () => {
                  await expect(
                      playerToken.transferFrom(deployer, user1, amount)
                  ).to.be.revertedWithCustomError(playerToken, "CustomToken__InsufficientAllowance")
              })
              it("Emit an approval event, when an approval occurs", async () => {
                  await expect(customToken.approve(user1, amount)).to.emit(customToken, "Approval")
              })
              it("The allowance being set is accurate", async () => {
                  await customToken.approve(user1, amount)
                  const allowance = await customToken.allowance(deployer, user1)
                  assert.equal(allowance.toString(), amount)
              })
              it("Won't allow a user to go over the allowance", async () => {
                  await customToken.approve(user1, amount)
                  await expect(
                      playerToken.transferFrom(
                          deployer,
                          user1,
                          ethers.utils.parseEther("40").toString()
                      )
                  ).to.be.revertedWithCustomError(customToken, "CustomToken__InsufficientAllowance")
              })
          })
          describe("mint & burn tokens", () => {
              const amount = ethers.utils.parseEther("20").toString()
              beforeEach(async () => {
                  playerToken = await ethers.getContract("CustomToken", user1)
              })
              it("Only owner allows to mint tokens", async () => {
                  await expect(playerToken.mint(amount)).to.be.revertedWithCustomError(
                      playerToken,
                      "CustomToken__NotOwner"
                  )

                  const totalSupply = await customToken.totalSupply()
                  await customToken.mint(amount)
                  await customToken.totalSupply()
                  assert.equal(
                      totalSupply.add(amount).toString(),
                      (await customToken.totalSupply()).toString()
                  )
              })
              it("Emit an transfer event when mint occurs", async () => {
                  await expect(customToken.mint(amount)).to.emit(customToken, "Transfer")
              })
              it("Only owner allows to burn tokens", async () => {
                  await customToken.transfer(user1, amount)
                  await expect(playerToken.burn(amount)).to.be.revertedWithCustomError(
                      playerToken,
                      "CustomToken__NotOwner"
                  )

                  const totalSupply = await customToken.totalSupply()
                  await customToken.burn(amount)
                  await customToken.totalSupply()
                  assert.equal(
                      totalSupply.sub(amount).toString(),
                      (await customToken.totalSupply()).toString()
                  )
              })
              it("Emit an transfer event when burn occurs", async () => {
                  await expect(customToken.burn(amount)).to.emit(customToken, "Transfer")
              })
              it("Won't allow burn exceeds balance", async () => {
                  await expect(
                      customToken.burn(BigNumber.from(INITIAL_SUPPLY).add(amount))
                  ).to.be.revertedWithCustomError(
                      customToken,
                      "CustomToken__BurnAmountExceedsBalance"
                  )
              })
          })
      })
