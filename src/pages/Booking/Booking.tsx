import { Web3Provider } from '@ethersproject/providers';
import { useWeb3React } from '@web3-react/core';
import { ethers } from 'ethers';
import { parseUnits } from 'ethers/lib/utils';
import { Formik } from 'formik';
import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { exchnageRates } from '../../api';
import { RequestData } from '../../api/types';
import { AvatarComponent } from '../../components/AvatarOrb';
import { ImagesSlider } from '../../components/Booking/ImagesSlider';
import { BookingCard, RightPanel } from '../../components/Booking/RightPanel';
import { PrimaryButton } from '../../components/Button';
import { Dropdown, Option } from '../../components/Dropdown/Dropdown';
import { HeaderContentGapSpacer } from '../../components/Header/Header';
import { PageContentWrapper, PageWrapper } from '../../components/layout/Common';
import { TextField } from '../../components/TextField';
import config from '../../config/config';
import { ERCTokenType } from '../../config/types';
import { getErc20Contract, useExchangeContractV1 } from '../../hooks/useContracts';
import { useCreator } from '../../hooks/useCreator';
import { useFee } from '../../hooks/useFee';
import { Description, Label } from '../../styles/typography';
import { getShortenedAddress } from '../../utils/address';
import { convertToFloat, convertToInt, formatETH, removeTrailingZero } from '../../utils/format';
import { Number } from '../../utils/validation';
import { isCreatorOnChain } from '../../web3/request';
import { FlexRow, HR, ImagesColumnContainer, PageGrid, PurchaseOption } from './Style';
import { BookingFormValues } from './types';

const BookingPage = () => {
  const { creatorId } = useParams();
  const { account, library, chainId } = useWeb3React<Web3Provider>();
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const exchangeContractV1 = useExchangeContractV1(true);
  const { creator, loaded } = useCreator(creatorId);
  const { FeeDescription } = useFee();
  const [user, setUser] = useState();
  const getUser = useSelector((state: any) => state.user);
  const ref = useRef(null as any);
  const [token, setToken] = useState<ERCTokenType>('MATIC');
  const [price, setPrice] = useState<number>(0);

  useEffect(() => {
    setUser(getUser);
  }, [getUser]);

  useEffect(() => {
    if (ref && ref.current) {
      window.scrollTo({
        top: ref.current.offsetTop,
      });
    }
  }, [ref]);

  useEffect(() => {
    if (loaded && creator) {
      exchnageRates(token, creator.price).then((convertedPrice) => {
        setPrice(parseFloat(convertedPrice));
      });
    }
  }, [loaded, token]);

  const handleSelect = (e: any) => {
    setToken(e.target.value);
  };

  const makeBooking = async (values: BookingFormValues) => {
    try {
      if (!creatorId) {
        toast.error('Booking request for this content creator cannot be created');
        return;
      }

      const isCreator = await isCreatorOnChain(exchangeContractV1, creatorId);
      if (!isCreator) {
        toast.error('Booking request for this content creator cannot be created');
        return;
      }

      const requestData: RequestData = {
        deadline: convertToInt(values.deadline),
        description: values.description,
      };

      let transaction;
      if (token && token == 'MATIC') {
        transaction = await exchangeContractV1.nativeNewRequest(
          creatorId,
          account as string,
          JSON.stringify(requestData),
          {
            value: ethers.utils.parseEther(values.amount),
          },
        );
      } else if (token) {
        const ERC20 = getErc20Contract(token, account as string, library as Web3Provider);
        const tx = await ERC20.approve(config.exchangeAddressV1, parseUnits(values.amount));

        toast.loading('Waiting for approval');
        await tx.wait();

        transaction = await exchangeContractV1.newRequest(
          creatorId,
          account as string,
          config.erc20Contracts[token],
          parseUnits(values.amount),
          JSON.stringify(requestData),
        );
      }

      toast.dismiss();
      toast.loading('Creating a new booking, waiting for confirmation');
      const receipt = transaction && (await transaction.wait());
      toast.dismiss();
      toast.success('Booking completed, your Order will reflect in few moments.');
      navigate('/orders');
    } catch (e) {
      toast.dismiss();
      toast.error(`The transaction failed. Make sure you have enough ${token} for gas.`);
    }
  };

  return (
    <PageWrapper>
      <HeaderContentGapSpacer />
      <PageContentWrapper ref={ref}>
        <PageGrid>
          <ImagesColumnContainer>
            {loaded && creator && creator.demos && <ImagesSlider images={creator.demos} />}
          </ImagesColumnContainer>
          <RightPanel creator={creator} account={account} loaded={loaded} user={user}>
            {(creator, account) => (
              <BookingCard>
                <FlexRow style={{ marginBottom: 12 }}>
                  <div>
                    <Label style={{ marginBottom: 8 }}>{creator.userName}</Label>
                    <Description>
                      Twitter:{' '}
                      <a
                        href={`https://twitter.com/${creator.twitterHandle}`}
                        target="_blank"
                        style={{ color: '#EDE641' }}
                      >
                        @{creator.twitterHandle}
                      </a>{' '}
                    </Description>
                    <Description>Address: {creator && getShortenedAddress(creator.address)}</Description>
                  </div>
                  <div>
                    <AvatarComponent url={creator.profilePicture} size="medium" twitterHandle={creator.twitterHandle} />
                  </div>
                </FlexRow>
                <FlexRow style={{ marginBottom: 24 }}>
                  <Description>{creator.bio}</Description>
                </FlexRow>

                <HR style={{ marginBottom: 36 }} />
                <Formik
                  initialValues={{
                    deadline: '0',
                    description: '',
                    amount: '0',
                  }}
                  validate={({ deadline, description, amount }) => {
                    const errors: any = {};
                    try {
                      Number.parse(parseFloat(amount));
                      if (parseFloat(amount) < convertToFloat(creator.price)) {
                        errors.amount = `Amount must be greater than ${creator.price}`;
                      }
                      if (parseFloat(amount) > 700) {
                        errors.amount = `Amount must be less than 700 Matic`;
                      }
                    } catch {
                      errors.amount = `Please enter a number.`;
                    }
                    if (deadline.toString() != parseInt(deadline.toString()).toString()) {
                      errors.deliveryTime = 'Delivery time cannot be a decimal or have leading zeros.';
                    } else {
                      try {
                        Number.parse(parseInt(deadline.toString()));
                        if (parseInt(deadline.toString()) < parseInt(creator.deliveryTime.toString())) {
                          errors.deadline = `Deadline must be greater than ${creator.deliveryTime}`;
                        }
                      } catch {
                        errors.deadline = `Please enter a deadline.`;
                      }
                      if (description === '') {
                        errors.description = 'Please write some instructions for the creator.';
                      }
                    }
                    return errors;
                  }}
                  validateOnBlur={false}
                  validateOnChange={false}
                  onSubmit={async (values) => {
                    setLoading(true);
                    await makeBooking(values);
                    setLoading(false);
                  }}
                >
                  {({ initialValues, handleChange, handleSubmit, errors, validateForm }) => (
                    <>
                      <PurchaseOption style={{ marginBottom: 40 }}>
                        <FlexRow style={{ marginBottom: 7 }}>
                          <Label>Personal use</Label>
                          <Label style={{ fontSize: 14 }}>
                            {formatETH(convertToFloat(creator.price))} {config.chainSymbol}+
                          </Label>
                        </FlexRow>
                        <Description>Personalized video for you or someone else</Description>
                      </PurchaseOption>
                      <div style={{ marginBottom: 40 }}>
                        <TextField
                          inputStyles={{
                            width: 172,
                          }}
                          type="number"
                          label={`Request deadline (${creator.deliveryTime} days minimum)`}
                          description={
                            "If your video isn't delivered by your requested deadline, you will be able to request a refund."
                          }
                          endText="Days"
                          onChange={handleChange('deadline')}
                          placeholder={`${creator.deliveryTime}+`}
                          errorMessage={errors.deadline}
                        />
                      </div>

                      <div style={{ marginBottom: 40 }}>
                        <TextField
                          inputElementType="textarea"
                          maxLength={1000}
                          label={`Instructions for ${creator.userName}`}
                          placeholder="Say something nice..."
                          onChange={handleChange('description')}
                          errorMessage={errors.description}
                        />
                      </div>

                      <div style={{ marginBottom: 40 }}>
                        <TextField
                          label="Address to receive video NFT"
                          placeholder="Wallet address"
                          value={user}
                          isDisabled
                        />
                      </div>

                      <div style={{ marginBottom: 40 }}>
                        <Dropdown formLabel="Select payment type" onChange={handleSelect}>
                          {config.erc20TokenNames.map((tok, i) => {
                            if (i == 0) {
                              <Option key={i} selected value={tok} />;
                            }
                            return <Option key={i} value={tok} />;
                          })}
                        </Dropdown>
                      </div>

                      <div style={{ marginBottom: 40 }}>
                        <TextField
                          inputStyles={{
                            width: 220,
                          }}
                          label="Amount to pay"
                          description={'Increase your bid to get your video earlier'}
                          endText={token}
                          type="number"
                          placeholder={
                            price && price != 0
                              ? removeTrailingZero(price.toFixed(7)) + '+'
                              : formatETH(convertToFloat(creator.price)) + '+'
                          }
                          onChange={handleChange('amount')}
                          errorMessage={errors.amount}
                        />
                        <FeeDescription />
                      </div>
                      <PrimaryButton
                        onPress={async () => {
                          setLoading(true);
                          const errors = await validateForm();
                          if (Object.keys(errors).length != 0) {
                            toast.error('Please fix the errors.');
                          } else {
                            handleSubmit();
                          }
                          setLoading(false);
                        }}
                        isDisabled={user && chainId === config.chainId ? loading : true}
                      >
                        {user
                          ? chainId === config.chainId
                            ? 'Book now'
                            : `Change Network to ${config.chainName}`
                          : 'Please Connect your wallet'}
                      </PrimaryButton>
                      <Description style={{ fontSize: 12, margin: '15px 0px' }}>
                        *These are unaudited contracts. Clipto.io assumes no responsibility or liability for any
                        transaction errors, faults or losses while making a booking or in the course of a booking being
                        fulfilled or thereafter.
                      </Description>
                    </>
                  )}
                </Formik>
              </BookingCard>
            )}
          </RightPanel>
        </PageGrid>
      </PageContentWrapper>
    </PageWrapper>
  );
};

export { BookingPage };
