import './index.css';
import {Link} from "react-router-dom";
import { Card, Typography } from 'antd';
import Banner from "./Banner";

const {Text} = Typography;

const Dashboard = ({...props}) => {
  return (
    <div>
      <Card title="Dashboard">
        <Banner/>
      </Card>
    </div>
  )
};


export default Dashboard;
