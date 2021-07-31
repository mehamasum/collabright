import './Banner.css';
import { Button, Card, Row, Col, Typography } from 'antd';
import { BulbOutlined } from "@ant-design/icons";
import banner from '../../assets/images/banner.svg';

const Banner = () => {
  return <div className="banner">
    <div>
      <div className="banner__header">
        <div className="banner__header_container">
          <div className="banner__header_content_container">
            <Typography.Title>Work with people outside your GIS Provider in Collabright</Typography.Title>
            <Typography.Text className="banner__header_subtext">
              A secure space to share maps and collaborate with other people, just like you do with your own team
            </Typography.Text>
            
            <Button type="link" className="banner__cta">
              <BulbOutlined/> <strong>See how Collabright works</strong>
            </Button>
          </div>
          <div role="presentation" className="banner__header_image--user_hub_v1">
            <img src={banner} alt=""></img>
          </div>
        </div>
      </div>
    </div>
  </div>
};

export default Banner;