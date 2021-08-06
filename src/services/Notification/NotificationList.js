import './NotificationList.css';

import React, { useEffect, useState } from 'react';
import useFetch from 'use-http';
import { Button, Card, Space, Table, Typography } from 'antd';
import { Link, } from "react-router-dom";
import { BellOutlined } from '@ant-design/icons';
import { formatRelativeTime } from '../../utils';
import { CommentOutlined, AuditOutlined } from '@ant-design/icons';




const NotificationList = (props) => {
  const [page, setPage] = useState({
    current: 1,
    pageSize: 10,
  });
  const [tableData, setTableData] = useState([]);

  const { get, post, response, loading } = useFetch();

  const markAsRead = (id) => () => {
    post(`/api/v1/notifications/${id}/mark_read/`).then(data => {
      if (response.ok) {
        window.location.reload(false);
      }
      console.error(data);
    });
  };

  const getNotificationText = (record) => {
    let verb = null, icon = null, target = null;
    switch (record.type) {
      case 'COMMENT':
        verb = 'commented';
        icon = <CommentOutlined />;
        target = `in v${JSON.parse(record.payload).version}.0 of ${record.audit.title}`
        break;
      case 'REVIEW':
        verb = 'submitted review';
        icon = <AuditOutlined />;
        target = `in ${record.audit.title}`
        break;
      default:
        break;
    }
    return { icon, verb, target };
  }

  const columns = [
    {
      title: <BellOutlined />,
      render: (text, record) => {
        const { verb, icon, target } = getNotificationText(record);
        const notification = `${record.reviewer.contact.email} ${verb} ${target}`
        return (
          <Space direction="vertical">
            <Typography.Text strong={!record.read_at}>{icon} {notification}</Typography.Text>
            <Typography.Text>{formatRelativeTime(record.created_at)}</Typography.Text>
          </Space>
        )
      }
    },
    {
      title: '',
      render: (text, record) => {
        return (
          !record.read_at && <Button type="link" onClick={markAsRead(record.id)}>Mark as Read</Button>
        )
      }
    },
    {
      title: '',
      render: (text, record) => {
        return (
          <Button type="link"><Link to={`/audits/${record.audit.id}/`}>Open</Link></Button>
        )
      }
    }
  ];

  const fetchList = (page) => {
    get(`/api/v1/notifications/?page=${page}`).then(data => {
      if (response.ok) {
        const newData = data.results.map(notification => ({ ...notification, key: notification.id }));
        setPage({
          ...page,
          total: data.count
        })
        return setTableData(newData);
      }
      console.error(data);
    });
  }

  useEffect(() => {
    fetchList(1);
  }, [])


  const onChange = (nextPage) => {
    fetchList(nextPage.current);
  };

  return (
    <div>
      <Card title="Notifications">
        <Table
          loading={loading}
          columns={columns}
          dataSource={tableData}
          pagination={page}
          onChange={onChange}
        />
      </Card>
    </div>
  );
};

export default NotificationList;