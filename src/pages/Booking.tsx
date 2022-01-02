import { Web3Provider } from '@ethersproject/providers';
import { useWeb3React } from '@web3-react/core';
import axios from 'axios';
import { errors, ethers, Transaction } from 'ethers';
import { Formik } from 'formik';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import styled from 'styled-components';

import pfp from '../assets/images/pfps/sample-profile.png';
import { AvatarComponent, AvatarOrb } from '../components/AvatarOrb';
import { PrimaryButton } from '../components/Button';
import { HeaderContentGapSpacer, HeaderSpacer } from '../components/Header';
import { ImagesSlider } from '../components/ImagesSlider';
import { PageContentWrapper, PageWrapper } from '../components/layout/Common';
import { TextField } from '../components/TextField';
import { API_URL } from '../config/config';
import { useExchangeContract } from '../hooks/useContracts';
import { CreateUserDto, UserProfile } from '../hooks/useProfile';
import { Description, Label } from '../styles/typography';
import { formatETH } from '../utils/format';
import { Number } from '../utils/validation';

const PageGrid = styled.div`
  display: grid;
  grid-template-columns: 504px 488px;
  grid-template-rows: 1fr;
  grid-column-gap: 40px;
  grid-row-gap: 0px;
  margin-bottom: 64px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: 1fr;
    width: 100%;
    grid-column-gap: 40px;
    grid-row-gap: 30px;
    max-width: 100%;
  `}
`;

const ImagesColumnContainer = styled.div`
  position: relative;
  height: 440px;
  max-width: 100%;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    overflow: hidden;
  `}
`;

const BookingCard = styled.div`
  background: ${(props) => props.theme.black};
  border: 1px solid ${(props) => props.theme.border};
  border-radius: 16px;
  padding: 32px 24px;
`;

// TODO(johnrjj) - Make into Radio/RadioGroup
const PurchaseOption = styled.div`
  border: 1px solid ${(props) => props.theme.yellow};
  border-radius: 16px;
  padding: 24px;
  cursor: pointer;
`;

const FlexRow = styled.div`
  display: flex;
  flex: 1;
  justify-content: space-between;
`;

const HR = styled.div`
  height: 1px;
  margin-left: -24px;
  width: calc(100% + 48px);
  background-color: ${(props) => props.theme.border};
`;

export interface CreateRequestDto {
  requester: string;
  requestId: number;
  creator: string;
  amount: string;
  description: string;
  deadline: number;
  txHash: string;
}

export interface ReadUserDto {
  address: string;
  bio: string;
  deliveryTime: number;
  demos: string[];
  id: number;
  profilePicture: string;
  price: string;
  tweetUrl: string;
  userName: string;
}

const BookingPage = () => {
  const { creatorId } = useParams();
  const { account } = useWeb3React<Web3Provider>();

  const exchangeContract = useExchangeContract(true);
  const [creatorProfile, setCreatorProfile] = useState<ReadUserDto>();
  const navigate = useNavigate();

  useEffect(() => {
    const getCreatorData = async () => {
      if (creatorId) {
        const restContractProfile: { data: ReadUserDto } = await axios.get(`${API_URL}/user/${creatorId}`);
        setCreatorProfile(restContractProfile.data);
      }
    };
    getCreatorData();
  }, [creatorId]);

  const makeBooking = async (
    requester: string,
    creator: string,
    amount: string,
    description: string,
    deadline: number,
  ) => {
    let tx;
    try {
      console.log(creator);
      tx = await exchangeContract.newRequest(creator, { value: ethers.utils.parseEther(amount) });
    } catch (e) {
      console.error('tx failed at Booking.tsx');
      console.error(e);
      return;
    }
    const receipt = await tx.wait();
    const requestId: number = receipt.events?.at(0)?.args?.index.toNumber();
    const requestDat: CreateRequestDto = {
      requester,
      requestId,
      creator,
      amount,
      description,
      deadline: parseInt(deadline.toString()), //This was actually a string before this line... forms will automatically change it to string but ts doesn't see that
      txHash: tx.hash,
    };
    console.log(requestDat);
    const requestResult = await axios.post(`${API_URL}/request/create`, { ...requestDat }).catch((e) => {
      console.error(e);
      toast.error(e);
    });

    if (requestResult && requestResult.status === 201) {
      navigate('/orders');
      toast.success('Request created!');
    } else {
      toast.error('Something is wrong.');
    }
  };

  return (
    <PageWrapper>
      <HeaderSpacer />
      <HeaderContentGapSpacer />
      <PageContentWrapper>
        <PageGrid>
          <ImagesColumnContainer>
            <ImagesSlider images={creatorProfile?.demos || []} />
          </ImagesColumnContainer>
          <BookingCard>
            <FlexRow style={{ marginBottom: 30 }}>
              <div>
                <Label style={{ marginBottom: 4 }}>{creatorProfile?.userName}</Label>
                {/* todo: decide what to do with this, it's not currently included in our profile data */}
                {/* <Description>Idea instigator</Description> */}
              </div>
              <div>
                <AvatarComponent url={creatorProfile?.profilePicture} />
              </div>
            </FlexRow>
            <FlexRow style={{ marginBottom: 24 }}>
              <Description>{creatorProfile?.bio}</Description>
            </FlexRow>

            <HR style={{ marginBottom: 36 }} />
            {!creatorProfile && <Label>Error loading creatorProfile</Label>}
            {!account && <Label>Error loading account</Label>}
            {creatorProfile && account && (
              <Formik
                initialValues={{
                  deadline: creatorProfile.deliveryTime,
                  description: '',
                  amount: 0,
                }}
                // validate={({ deadline, description, amount }) => {
                //   try {
                //     Number.parse(amount);
                //     if (formatETH(amount) < formatETH(parseFloat(creatorProfile.price))) {
                //       throw 'catch me';
                //     }
                //   } catch {
                //     toast.error(`Amount must be greator than ${creatorProfile.price}`);
                //     return;
                //   }
                // }}
                onSubmit={({ deadline, description, amount }) => {
                  makeBooking(account, creatorProfile.address, amount.toString(), description, deadline);
                }}
              >
                {({ initialValues, handleChange, handleSubmit, errors, validateForm }) => (
                  <>
                    <PurchaseOption style={{ marginBottom: 40 }}>
                      <FlexRow style={{ marginBottom: 7 }}>
                        <Label>Personal use</Label>
                        <Label style={{ fontSize: 14 }}>{formatETH(parseFloat(creatorProfile.price))} ETH +</Label>
                      </FlexRow>
                      <Description>Personalized video for you or someone else</Description>
                    </PurchaseOption>
                    <div style={{ marginBottom: 40 }}>
                      <TextField
                        inputStyles={{
                          width: 172,
                        }}
                        type="number"
                        label={`Request deadline (${initialValues.deadline} days minimum)`}
                        description={
                          'If your video isn’t delivered by your requested deadline, you will receive an automatic refund.'
                        }
                        endText="Days"
                        onChange={handleChange('deadline')} //parseInt
                        placeholder={`${creatorProfile.deliveryTime} days`}
                      />
                    </div>

                    <div style={{ marginBottom: 40 }}>
                      <TextField
                        inputElementType="textarea"
                        label={`Instructions for ${creatorProfile.userName}`}
                        placeholder="Say something nice..."
                        onChange={handleChange('description')}
                      />
                    </div>

                    <div style={{ marginBottom: 40 }}>
                      <TextField label="Address to receive video NFT" placeholder="Wallet address" value={account} />
                    </div>

                    <div style={{ marginBottom: 40 }}>
                      <TextField
                        inputStyles={{
                          width: 172,
                        }}
                        label="Amount to pay"
                        description={'Increase your bid to get your video earlier'}
                        endText="ETH"
                        type="number"
                        placeholder={formatETH(parseFloat(creatorProfile.price)) + ' +'}
                        onChange={handleChange('amount')}
                        onBlur={(e) => {}}
                        errorMessage={errors.amount}
                      />
                    </div>
                    <PrimaryButton
                      onPress={() => {
                        validateForm();
                        if (Object.keys(errors).length != 0) {
                          toast.error('Please fix the errors.');
                          return;
                        }
                        return handleSubmit();
                      }}
                      isDisabled={false}
                    >
                      Book now
                    </PrimaryButton>
                  </>
                )}
              </Formik>
            )}
          </BookingCard>
        </PageGrid>
      </PageContentWrapper>
    </PageWrapper>
  );
};

export { BookingPage };
