import './AuditList.css';

import React, { useEffect, useState } from 'react';
import useFetch from 'use-http';
import { Space, Table, Tag, Typography } from 'antd';
import { Link } from "react-router-dom";
import { truncateString } from '../../utils';

const { Text } = Typography;

const columns = [
  {
    title: 'Title',
    dataIndex: 'title',
    render: (text, record) => (
      <Space direction="vertical">
        <div>
          <Tag size="small" color={record.is_open ? 'success' : 'purple'}>
            {record.is_open ? 'Open' : 'Closed'}
          </Tag>
          <Typography.Text><Link to={`/audits/${record.id}`}>{truncateString(record.title, 120)}</Link></Typography.Text>
        </div>
      </Space>
    )
  }
];

const PostListView = (props) => {
  const [, setPage] = useState({
    current: 1,
    pageSize: 10,
  });
  const [tableData, setTableData] = useState([]);

  const { get, response, loading } = useFetch();

  const fetchList = (page) => {
    get(`/api/v1/audits/?page=${page}`).then(data => {
      if (response.ok) {
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

  const onChange = (nextPage) => {
    fetchList(nextPage.current);
  };

  return (
    <>
      <Text strong>Recent Activity</Text><br /><br />
      <Table
        showHeader={false}
        loading={loading}
        columns={columns}
        dataSource={tableData}
        pagination={{ position: ['none', 'none'] }}
        onChange={onChange}
      />
    </>
  );
};

export default PostListView;