import './Banner.css';
import { Button, Typography } from 'antd';
import { BulbOutlined } from "@ant-design/icons";
import banner from '../../assets/images/banner.svg';

const Banner = () => {
  return <div className="banner">
    <div>
      <div className="banner-header">
        <div className="banner-header-container">
          <div className="banner-header-content_container">
            <Typography.Title>Work with people outside your GIS provider in Collabright</Typography.Title>
            <Typography.Text className="banner-header-subtext">
              A secure space to share maps and collaborate with external stakeholders, just like you do with your own team.
              Collect feeback and get approval through eSignature, in a jiffy!
            </Typography.Text>

            <a href="https://youtu.be/75aKAiwrdYA" target="_blank" rel="noreferrer">
              <Button type="link" className="banner-cta">
                <BulbOutlined /> <strong>See how Collabright works</strong>
              </Button>
            </a>
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