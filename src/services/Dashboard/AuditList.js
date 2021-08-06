import './AuditList.css';

import React, { useEffect, useState } from 'react';
import useFetch from 'use-http';
import { Avatar, Button, Card, Space, Table, Tag, Typography } from 'antd';
import { Link, useHistory } from "react-router-dom";
import { LinkOutlined } from '@ant-design/icons';
import { formatRelativeTime, truncateString } from '../../utils';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';

const { Text } = Typography;

const columns = [
  {
    title: 'Title',
    dataIndex: 'title',
    render: (text, record) => (
      <Space direction="vertical">
        <div><Tag size="small" color={record.is_open ? 'success' : 'purple'}>{record.is_open ? 'Open' : 'Closed'}</Tag><Typography.Text><Link to={`/audits/${record.id}`}>{truncateString(record.title, 120)}</Link></Typography.Text></div>
      </Space>
    )
  }
];

const PostListView = (props) => {
  const [empty, setEmpty] = useState(true);
  const [page, setPage] = useState({
    current: 1,
    pageSize: 10,
  });
  const [tableData, setTableData] = useState([]);

  const { get, response, loading } = useFetch();

  const fetchList = (page) => {
    get(`/api/v1/audits/?page=${page}`).then(data => {
      if (response.ok) {
        console.log(data);
        setEmpty(data.count > 0);
        const newData = data.results
          .slice(0, 5)
          .sort((audit1, audit2) => {
            const date1 = audit1.documents[audit1.documents.length - 1]?.created_at;
            const date2 = audit2.documents[audit2.documents.length - 1]?.created_at;
            return new Date(date2) - new Date(date1);
          })
          .map(audit => ({ ...audit, key: audit.id }));
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
  }, []);

  if(empty) return null;

  const onChange = (nextPage) => {
    console.log(nextPage);
    fetchList(nextPage.current);
  };

  return (
    <Space direction="vertical">
      <Text strong>Recent Activity</Text>
      <Table
        showHeader={false}
        size="small"
        loading={loading}
        columns={columns}
        dataSource={tableData}
        pagination={{ position: ['none', 'none'] }}
        onChange={onChange}
      />
    </Space >
  );
};

export default PostListView;