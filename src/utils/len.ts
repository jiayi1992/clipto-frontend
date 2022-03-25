import { ethers } from 'ethers';
import { authenticate, generateChallenge, getLenQuery } from '../api/len-query';

// This code will assume you are using MetaMask.
// It will also assume that you have already done all the connecting to metamask
// this is purely here to show you how the public API hooks together
export const ethersProvider = new ethers.providers.Web3Provider(window.ethereum);

export const getAddress = async() => {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  return accounts[0];
}

export const signText = (text : string) => {
  const signer = ethersProvider.getSigner()
  
  return signer.signMessage(text)
}

export const getUser = (address : string) => {
  return getLenQuery(address)
}


export const login = async () => {
  const address = await getAddress();
  console.log(address)
  const challengeResponse = await generateChallenge(address);
  console.log(challengeResponse)
  // sign the text with the wallet
  const signature = await signText(challengeResponse.data.challenge.text)
  const authResponse = await authenticate(address, signature)
  return authResponse
}