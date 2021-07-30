import React, { useState } from 'react';
import { Select } from 'antd';
import useFetch from 'use-http';

const { Option } = Select;

const SearchAuditor = ({ className, onChange }) => {
  const [data, setData] = useState([]);
  const [value, setValue] = useState(undefined);
  const { get, post, patch, response } = useFetch();

  const getData = (value, onSuccess) => {
    console.log('getting');
    get(`/api/v1/contacts/?search=${value}`)
    .then(result => {
      if (response.ok) {
        console.log('got', result);
        onSuccess(result.results);
      }
      console.error(result);
    })
  }

  const handleSearch = value => {
    console.log('searching', value);
    if (value) {
      getData(value, data => setData(data));
    } else {
      setData([]);
    }
  };

  const handleChange = value => {
    console.log('handleChange', value);
    setValue(value);
    onChange(value);
  };

  const options = data.map(d => <Option key={d.email}>{d.name} ({d.email})</Option>);
  return (
    <Select
      className={className}
      mode="tags" 
      showSearch
      value={value}
      placeholder="Search with email"
      defaultActiveFirstOption={false}
      showArrow={false}
      filterOption={false}
      onSearch={handleSearch}
      onChange={handleChange}
      notFoundContent={null}
    >
      {options}
    </Select>
  ); 
};

export default SearchAuditor;