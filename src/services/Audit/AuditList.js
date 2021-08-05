import './AuditList.css';

import React, {useEffect, useState} from 'react';
import useFetch from 'use-http';
import {Avatar, Button, Card, Space, Table, Tag, Typography} from 'antd';
import {Link, useHistory} from "react-router-dom";
import {LinkOutlined} from '@ant-design/icons';
import {formatRelativeTime, truncateString} from '../../utils';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';

const columns = [
  {
    title: 'Title',
    dataIndex: 'title',
    render: (text, record) => (
      <Space direction="vertical">
        <div><Tag size="small" color={record.is_open ? 'success' : 'purple'}>{record.is_open ? 'Open' : 'Closed'}</Tag><Typography.Text><Link to={`/audits/${record.id}`}>{truncateString(record.title, 64)}</Link></Typography.Text></div>
        <small><Typography.Paragraph>Created {formatRelativeTime(record.created_at)}</Typography.Paragraph></small>
      </Space>
    )
  },
  {
    title: 'Map',
    render: (text, record) => (
      <Space size="middle">
        <a target="_blank" rel="noopener noreferrer" href={record.map_url}><LinkOutlined/> Link</a>
      </Space>
    ),
  },
  {
    title: 'Latest',
    render: (text, record) => (
      <Typography.Text>v{record.documents.length}.0</Typography.Text>
    ),
  }
];

const PostListView = (props) => {
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
        const newData = data.results.map(audit => ({ ...audit, key: audit.id}));
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
    console.log(nextPage);
    fetchList(nextPage.current);  
  };

  return (
    <div>
      <Card title="Audits" extra={
        <Space>
          <Button icon={<SearchOutlined />}>Search</Button>
          <Link to={`/audits/new`}><Button type="primary" icon={<PlusOutlined/>}>Audit Request</Button></Link>
        </Space>
      }>
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

export default PostListView;