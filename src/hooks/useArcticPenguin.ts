import { useState, useEffect } from "react";

const ARCTIC_PENGUIN_COLLECTION_ID = "0xf512c079941037aa3f8b6853d8f366ac1a70eaed7e2653ec9506e47ba199f861";
const PRIMARY_INDEXER = "https://rpc.sentio.xyz/movement-indexer/v1/graphql";
const FALLBACK_INDEXER = "https://indexer.mainnet.movementnetwork.xyz/v1/graphql";

export interface NFTDetails {
  name: string;
  image: string;
}

export interface ArcticData {
  hasNFT: boolean;
  nfts: any[];
  count: number;
  nftDetails: NFTDetails | null;
}

const query = `
  query GetArcticPenguins($owner: String!, $collectionId: String!) {
    current_token_ownerships_v2(
      where: {
        owner_address: {_eq: $owner},
        amount: {_gt: "0"},
        current_token_data: {
          collection_id: {_eq: $collectionId}
        }
      }
      order_by: {last_transaction_timestamp: desc}
    ) {
      token_data_id
      amount
      current_token_data {
        token_name
        token_uri
        token_properties
        collection_id
        current_collection {
          collection_name
          creator_address
          description
          uri
        }
      }
    }
  }
`;

async function fetchFromEndpoint(endpoint: string, ownerAddress: string) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      variables: {
        owner: ownerAddress,
        collectionId: ARCTIC_PENGUIN_COLLECTION_ID
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch NFTs: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  if (data.errors) {
    throw new Error(data.errors[0]?.message || 'GraphQL query failed');
  }

  return data.data?.current_token_ownerships_v2 || [];
}

async function getUserNFTs(ownerAddress: string) {
  try {
    return await fetchFromEndpoint(PRIMARY_INDEXER, ownerAddress);
  } catch (primaryError) {
    try {
      return await fetchFromEndpoint(FALLBACK_INDEXER, ownerAddress);
    } catch (fallbackError) {
      return [];
    }
  }
}

export async function fetchNFTMetadata(tokenUri: string) {
  try {
    let fetchUrl = tokenUri;
    if (tokenUri.startsWith('ipfs://')) {
      fetchUrl = tokenUri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
    }

    const response = await fetch(fetchUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) return null;

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) return null;

    const metadata = await response.json();

    if (metadata.image && typeof metadata.image === 'string' && metadata.image.startsWith('ipfs://')) {
      metadata.image = metadata.image.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
    }

    return metadata;
  } catch (error) {
    return null;
  }
}

export function useArcticPenguin(address: string | null | undefined) {
  const [data, setData] = useState<ArcticData>({
    hasNFT: false,
    nfts: [],
    count: 0,
    nftDetails: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNFTs = async () => {
    if (!address) {
      setData({ hasNFT: false, nfts: [], count: 0, nftDetails: null });
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const ownerships = await getUserNFTs(address);

      let nftDetails: NFTDetails | null = null;

      if (ownerships && ownerships.length > 0) {
        const tokenData = ownerships[0].current_token_data;
        let imgUri = '';

        if (tokenData.token_properties && typeof tokenData.token_properties === 'object' && tokenData.token_properties.image) {
           imgUri = tokenData.token_properties.image;
           if (imgUri.startsWith('ipfs://')) {
             imgUri = imgUri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
           }
        } 
        else if (tokenData.token_uri) {
           let directUri = tokenData.token_uri;
           if (directUri.startsWith('ipfs://')) {
             directUri = directUri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
           }

           const metadata = await fetchNFTMetadata(tokenData.token_uri);
           if (metadata && metadata.image) {
             imgUri = metadata.image;
           } else if (metadata && metadata.image_url) {
             imgUri = metadata.image_url;
           } else {
             // If the metadata fetch returned null (e.g. Content-Type was image/png instead of json)
             // then the token_uri itself is likely the direct image link!
             imgUri = directUri;
           }
        }

        nftDetails = {
          name: tokenData.token_name || 'Arctic Penguin',
          image: imgUri || ''
        };
      }

      setData({
        hasNFT: ownerships.length > 0,
        nfts: ownerships,
        count: ownerships.length,
        nftDetails
      });
    } catch (err: any) {
      console.error("Error fetching Arctic Penguin NFTs:", err);
      setError(err.message || "Failed to fetch NFTs");
      setData({ hasNFT: false, nfts: [], count: 0, nftDetails: null });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNFTs();
  }, [address]);

  return {
    data: data,
    isLoading,
    error,
    refresh: fetchNFTs
  };
}
