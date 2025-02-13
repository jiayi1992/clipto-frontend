import { Web3Provider } from '@ethersproject/providers';
import { useWeb3React } from '@web3-react/core';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTheme } from 'styled-components';
import * as api from '../../api';
import { featuredCreators } from '../../api/index';
import { EntityCreator } from '../../api/types';
import background1D from '../../assets/images/homepage/page1/background1D.png';
import background1M from '../../assets/images/homepage/page1/background1M.png';
import background3D from '../../assets/images/homepage/page3/background3D.png';
import background3M from '../../assets/images/homepage/page3/background3M.png';
import { CreatorCards } from '../../components/CreatorCards/CreatorCards';
import { PageWrapper } from '../../components/layout/Common';
import Slides from '../../components/Slides/Slides';
import {
  BookNow,
  BookNowButton,
  HeroTitle, LeftContentWrapper
} from '../../components/Slides/Style';
import { UserDisplay } from '../../components/UserDisplay/UserDisplay';
import config from '../../config/config';
import { UserProfile } from '../../hooks/useProfile';

const featuredList: string[] = [
  '0xCFFE08BDf20918007f8Ab268C32f8756494fC8D8', // Gabriel Haines.eth
  '0x0f32c8fBD8FE29D5EF451Ed9F8a13062C00ED583', // Fedrick
  '0x8d86932d23d3766fe317b0e385fcac24806ba9a3', // Lee Eller
  '0x0c44cb8087a269e7cc1f416a9bb4d5e9fed4eb9f', // bobburnquist
  '0x1c6f1a832e73949c97fe335a98b6a5fc3c9c29e9', // mackrypto
];
const featuredListTest: string[] = [
  '0x7c98c2dec5038f00a2cbe8b7a64089f9c0b51991', // atul
  '0x8b2a6a22ec055225C4c4b5815e7d9F566b8be68F', // rushi
  '0x7cacbc75d74740b50dc68fbf0a573af80243ca56', // jon
  '0x6e4cd1a58e0d1309da36f1ce1e456e5b93483175', // lee
];

const HomePage = () => {
  let [creators, setCreators] = useState<EntityCreator[]>([]);

  const [creator, setCreator] = useState<Partial<UserProfile> | null>();
  const { account } = useWeb3React<Web3Provider>();
  const user = useSelector((state: any) => state.user);
  const theme = useTheme();

  const warning = (msg: string) => toast.warn(msg);

  useEffect(() => {
    const getCreatorData = async () => {
      if (account) {
        try {
          const response = await api.creatorById(account || '');
          if (response.data && response.data.creator) {
            setCreator(response.data.creator);
          }
        } catch (e) {
          setCreator(null);
        }
      }
    };
    getCreatorData();
  }, [account]);

  useEffect(() => {
    const creatorAddresses =
      config.environment === 'test'
        ? featuredListTest.map((c) => c.toLowerCase())
        : featuredList.map((c) => c.toLowerCase());

    featuredCreators(creatorAddresses).then((response) => {
      if (response.data) {
        const sorted = response.data.creators.sort((a, b) => {
          return creatorAddresses.indexOf(a.address.toLowerCase()) - creatorAddresses.indexOf(b.address.toLowerCase());
        });
        setCreators(sorted);
      }
    });
  });

  let slideContent = [
    <LeftContentWrapper>
      <HeroTitle>
        Personalized videos from your favorite{' '}
        <span style={{ color: theme.yellow, fontWeight: '700' }}>crypto stars</span>
      </HeroTitle>
      <div style={{ display: 'inline-block', width: 'fit-content' }}>
        <Link to={'/explore'}>
          <BookNow color={theme.purple}>Book Now</BookNow>
        </Link>
      </div>
    </LeftContentWrapper>,
    <LeftContentWrapper>
      <HeroTitle>
        Become a creator
        <br />
        Make a <span style={{ fontFamily: 'Eina01-Bold' }}>CLIPTO</span> profile{' '}
        <span style={{ color: theme.yellow, fontWeight: '700' }}>now</span>
      </HeroTitle>
      <div style={{ display: 'inline-block', width: 'fit-content' }}>
        {user && creator ? (
          <BookNowButton color={theme.purple} onClick={() => warning("You're already a creator")}>
            Become a Creator
          </BookNowButton>
        ) : user ? (
          <Link to={'/onboarding'}>
            <BookNow color={theme.purple}>Become a Creator</BookNow>
          </Link>
        ) : (
          <BookNowButton color={theme.purple} onClick={() => warning('Please connect your wallet')}>
            Become a Creator
          </BookNowButton>
        )}
      </div>
    </LeftContentWrapper>,
  ];

  return (
    <>
      <PageWrapper style={{ top: 0 }}>
        <Slides backgroundD={[background1D, background3D]} backgroundM={[background1M, background3M]}>
          {slideContent}
        </Slides>
        <UserDisplay users={creators} handleScroll={() => {}} hasMore={false} title="Featured" />
        <CreatorCards />
      </PageWrapper>
    </>
  );
};

export { HomePage };
