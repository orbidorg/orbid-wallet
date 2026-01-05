import { NextRequest, NextResponse } from 'next/server';

const UNISWAP_GRAPHQL_ENDPOINT = 'https://interface.gateway.uniswap.org/v1/graphql';

const TOKEN_WEB_QUERY = `
  query TokenWeb($chain: Chain!, $address: String = null) {
    token(chain: $chain, address: $address) {
      id
      decimals
      name
      chain
      address
      symbol
      standard
      market(currency: USD) {
        id
        totalValueLocked {
          id
          value
          currency
          __typename
        }
        price {
          id
          value
          currency
          __typename
        }
        volume24H: volume(duration: DAY) {
          id
          value
          currency
          __typename
        }
        priceHigh52W: priceHighLow(duration: YEAR, highLow: HIGH) {
          id
          value
          __typename
        }
        priceLow52W: priceHighLow(duration: YEAR, highLow: LOW) {
          id
          value
          __typename
        }
        __typename
      }
      project {
        id
        name
        description
        homepageUrl
        twitterName
        logoUrl
        isSpam
        tokens {
          id
          chain
          address
          __typename
        }
        markets(currencies: [USD]) {
          id
          fullyDilutedValuation {
            id
            value
            currency
            __typename
          }
          marketCap {
            id
            value
            currency
            __typename
          }
          __typename
        }
        __typename
      }
      __typename
    }
  }
`;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { address } = body;

        if (!address) {
            return NextResponse.json({ error: 'Token address is required' }, { status: 400 });
        }

        const response = await fetch(UNISWAP_GRAPHQL_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://app.uniswap.org',
            },
            body: JSON.stringify({
                operationName: 'TokenWeb',
                variables: {
                    address: address.toLowerCase(),
                    chain: 'WORLDCHAIN'
                },
                query: TOKEN_WEB_QUERY
            })
        });

        if (!response.ok) {
            console.error('[Uniswap Proxy] API error:', response.status);
            return NextResponse.json({ error: 'Uniswap API error' }, { status: response.status });
        }

        const data = await response.json();

        if (data.errors) {
            console.error('[Uniswap Proxy] GraphQL errors:', data.errors);
            return NextResponse.json({ error: 'GraphQL error', details: data.errors }, { status: 400 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('[Uniswap Proxy] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
