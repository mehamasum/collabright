import './AuditList.css';

import React, { useEffect, useState } from 'react';
import useFetch from 'use-http';
import { Button, Card, Space, Table, Tag, Typography, message } from 'antd';
import { Link } from "react-router-dom";
import { LinkOutlined } from '@ant-design/icons';
import { formatRelativeTime, truncateString } from '../../utils';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';


const columns = [
  {
    title: 'Title',
    dataIndex: 'title',
    render: (text, record) => (
      <Space>
        <Tag size="small" color={record.is_open ? 'success' : 'purple'}>{record.is_open ? 'Open' : 'Closed'}</Tag>
        <Typography.Text><Link to={`/audits/${record.id}`}>{truncateString(record.title, 20)}</Link></Typography.Text>
      </Space>
    )
  },
  {
    title: 'Created',
    render: (text, record) => (
      <Typography.Text>{formatRelativeTime(record.created_at)}</Typography.Text>
    ),
  },
  {
    title: 'Latest',
    render: (text, record) => (
      <Space>
        <Typography.Text>v{record.documents.length}.0</Typography.Text>
      </Space>
    ),
  },
  {
    title: 'Updated',
    render: (text, record) => (
      <Typography.Text>{formatRelativeTime(record.documents[record.documents.length - 1]?.created_at)}</Typography.Text>
    ),
  },
  {
    title: 'Map',
    render: (text, record) => (
      <a target="_blank" rel="noopener noreferrer" href={record.map_url}><LinkOutlined /> Link</a>
    )
  },
  {
    title: 'Agreement',
    render: (text, record) => (
      <Typography.Text>{record.status === 'sent' ? 'Sent' : 'In Draft'}</Typography.Text>
    )
  },

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
        const newData = data.results.map(audit => ({ ...audit, key: audit.id }));
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
      <Card title="Audits" extra={
        <Space>
          {/* TODO: implement this */}
          <Button icon={<SearchOutlined />} onClick={() => message.error('This feature is not available yet')}>Search</Button>
          <Link to={`/audits/new`}><Button type="primary" icon={<PlusOutlined />}>Audit Request</Button></Link>
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