import './Banner.css';
import { Button, Card, Row, Col, Typography } from 'antd';
import { BulbOutlined } from "@ant-design/icons";
import banner from '../../assets/images/banner.svg';

const Banner = () => {
  return <div className="banner">
    <div>
      <div className="banner-header">
        <div className="banner-header-container">
          <div className="banner-header-content_container">
            <Typography.Title>Work with people outside your GIS Provider in Collabright</Typography.Title>
            <Typography.Text className="banner-header-subtext">
              A secure space to share maps and collaborate with other people, just like you do with your own team
            </Typography.Text>
            
            <Button type="link" className="banner-cta">
              <BulbOutlined/> <strong>See how Collabright works</strong>
            </Button>
          </div>
          <div role="presentation" className="banner-header-image">
            <img src={banner} alt=""></img>
          </div>
        </div>
      </div>
    </div>
  </div>
};

export default Banner;