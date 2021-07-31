import './index.css';
import {Link} from "react-router-dom";
import IntegrationsTab from './IntegrationsTab';
import { Card, Typography } from 'antd';

const {Text} = Typography;

const Dashboard = ({...props}) => {
  return (
    <div>
      <Card title="Dashboard">
        <Text strong>Integrations</Text>
        <IntegrationsTab/>
      </Card>
    </div>
  )
};


export default Dashboard;
