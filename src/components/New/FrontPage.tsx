import styled, { keyframes } from 'styled-components';
import background1 from '../../assets/images/homepage/page1/background.png';
import background2 from '../../assets/images/homepage/page2/background.png';
import background3 from '../../assets/images/homepage/page3/background.png';

interface SlidesProps {
  translate: any;
}
export const Slides = styled.div<SlidesProps>`
  display: flex;
  flex-direction: row;
  width: 300vw;
  transition: transform 1s;
  transform: ${(props) => `translateX(${props.translate}%)`};
`;

interface BackgroundWrapperProps {
  background: string;
  translate: any;
}
export const BackgroundWrapper = styled.div<BackgroundWrapperProps>`
  background-image: url(${(props) => props.background});
  background-position: center center;
  background-size: cover;
  width: 100vw;
  height: 100%;
  opacity: 100%;
  transform: ${(props) => `translateX(${props.translate}%)`};
  overflow: hidden;
`;
