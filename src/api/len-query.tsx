import { createClient, GraphQLRequest } from "urql";
import { Address } from "../utils/validation";

const graphInstance = createClient({
  url: "https://api-mumbai.lens.dev/",
});

export const generateChallenge = (address : any) => {
  const challengeQuery = `query Challenge {
    challenge(request: { address: "${address}" }) {
      text
    }
  }`
  return graphInstance.query(challengeQuery).toPromise()
}

export const authenticate = (address: string, signature: string) => {
  const authQuery = `mutation Authenticate {
    authenticate(request: {
      address: "${address}",
      signature: "${signature}"
    }) {
      accessToken
      refreshToken
    }
  }`
  return graphInstance.mutation(authQuery).toPromise()
}


const CREATE_PROFILE = `mutation($request: CreateProfileRequest!) { 
  createProfile(request: $request) {
    ... on RelayerResult {
      txHash
    }
    ... on RelayError {
      reason
    }
          __typename
  }
}`

export type CreateProfileRequest = {
  handle: string,
  profilePictureUri?: string,
  followModule?: any,
  followNFTURI?: string
}
export const createProfile = (createProfileRequest: CreateProfileRequest, accessToken : string) => {
  return graphInstance.mutation(CREATE_PROFILE, {request: createProfileRequest}, {
    fetchOptions: {
      headers: {
        "x-access-token":accessToken
      }
    }
  }).toPromise()
}


export const getLenQuery = (address : string) => {
  const GET_PROFILE = `query Profiles {
    profiles(request: { ownedBy: ["${address}"], limit: 10 }) {
      items {
        id
        name
        bio
        location
        website
        twitterUrl
        picture {
          ... on NftImage {
            contractAddress
            tokenId
            uri
            verified
          }
          ... on MediaSet {
            original {
              url
              mimeType
            }
          }
          __typename
        }
        handle
        coverPicture {
          ... on NftImage {
            contractAddress
            tokenId
            uri
            verified
          }
          ... on MediaSet {
            original {
              url
              mimeType
            }
          }
          __typename
        }
        ownedBy
        depatcher {
          address
          canUseRelay
        }
        stats {
          totalFollowers
          totalFollowing
          totalPosts
          totalComments
          totalMirrors
          totalPublications
          totalCollects
        }
        followModule {
          ... on FeeFollowModuleSettings {
            type
            amount {
              asset {
                symbol
                name
                decimals
                address
              }
              value
            }
            recipient
          }
          __typename
        }
      }
      pageInfo {
        prev
        next
        totalCount
      }
    }
  }`
  return graphInstance.query(GET_PROFILE).toPromise()
}