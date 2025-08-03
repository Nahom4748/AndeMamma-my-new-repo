import React, { useEffect, useState } from "react";
import {
  Card,
  List,
  Tag,
  Avatar,
  Typography,
  Select,
  Button,
  message,
  Spin,
  Space,
  Badge,
} from "antd";
import {
  SyncOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import axios from "axios";
import moment from "moment";

const { Text } = Typography;
const { Option } = Select;

const statusOptions = [
  { value: "pending", label: "Pending", icon: <SyncOutlined />, color: "orange" },
  { value: "in_progress", label: "In Progress", icon: <SyncOutlined spin />, color: "blue" },
  { value: "completed", label: "Completed", icon: <CheckCircleOutlined />, color: "green" },
  { value: "rejected", label: "Rejected", icon: <CloseCircleOutlined />, color: "red" },
];

const DailyCollectionReport = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingStatusId, setEditingStatusId] = useState(null);
  const [statusValues, setStatusValues] = useState({});
  const [date, setDate] = useState(moment().format("YYYY-MM-DD"));

  useEffect(() => {
    fetchDailyCollections();
  }, [date]);

  const fetchDailyCollections = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/daily-collections?date=${date}`);
      const rawData = res.data.data || [];

      // Generate unique ID and initialize statuses
      const uniqueSuppliers = getUniqueSuppliers(rawData);
      const statuses = {};

      uniqueSuppliers.forEach((item) => {
        const id = `${item.supplier_name}-${item.collection_type}`;
        item.id = id;
        statuses[id] = item.status || "pending";
      });

      setCollections(uniqueSuppliers);
      setStatusValues(statuses);
    } catch (error) {
      console.error("Error fetching data", error);
      message.error("Failed to load daily collections");
    } finally {
      setLoading(false);
    }
  };

  const getUniqueSuppliers = (data) => {
    const seen = new Set();
    const unique = [];

    data.forEach((item) => {
      const key = `${item.supplier_name}-${item.collection_type}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(item);
      }
    });

    return unique;
  };

  const handleStatusChange = (id, value) => {
    setStatusValues({ ...statusValues, [id]: value });
  };

  const handleSave = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/daily-collections/${id}/status`, {
        status: statusValues[id],
      });
      message.success("Status updated");
      setEditingStatusId(null);
      fetchDailyCollections();
    } catch (err) {
      message.error("Failed to update status");
    }
  };

  const countByStatus = (status) => {
    return collections.filter((item) => statusValues[item.id] === status).length;
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <Card
        bordered={false}
        className="shadow-sm"
        title={
          <div className="flex flex-col md:flex-row md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800">📋 Daily Collection Report</h2>
              <Text type="secondary">{moment(date).format("MMMM D, YYYY")}</Text>
            </div>
            <div>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border rounded px-3 py-1 mt-2 md:mt-0"
              />
            </div>
          </div>
        }
      >
        <div className="mb-4">
          <Space wrap>
            <Badge count={collections.length} showZero color="#3b82f6" />
            <Tag icon={<SyncOutlined />} color="orange">
              Pending: {countByStatus("pending")}
            </Tag>
            <Tag icon={<SyncOutlined spin />} color="blue">
              In Progress: {countByStatus("in_progress")}
            </Tag>
            <Tag icon={<CheckCircleOutlined />} color="green">
              Completed: {countByStatus("completed")}
            </Tag>
            <Tag icon={<CloseCircleOutlined />} color="red">
              Rejected: {countByStatus("rejected")}
            </Tag>
          </Space>
        </div>

        {loading ? (
          <Spin />
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={collections}
            renderItem={(item) => {
              const currentStatus = statusValues[item.id] || "pending";
              const statusMeta = statusOptions.find((opt) => opt.value === currentStatus);

              return (
                <List.Item
                  className="border rounded-md p-4 mb-3 shadow-sm bg-white"
                  actions={[
                    editingStatusId === item.id ? (
                      <Button
                        type="primary"
                        size="small"
                        icon={<SaveOutlined />}
                        onClick={() => handleSave(item.id)}
                      />
                    ) : (
                      <Button
                        type="text"
                        icon={<EditOutlined />}
                        size="small"
                        onClick={() => setEditingStatusId(item.id)}
                      />
                    ),
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        src={`https://ui-avatars.com/api/?name=${item.supplier_name}&background=random`}
                      />
                    }
                    title={<Text strong>{item.supplier_name}</Text>}
                    description={
                      <Space direction="vertical">
                        <Tag color={item.collection_type === "Instore" ? "green" : "blue"}>
                          {item.collection_type}
                        </Tag>
                        {editingStatusId === item.id ? (
                          <Select
                            value={currentStatus}
                            onChange={(value) => handleStatusChange(item.id, value)}
                            style={{ width: 150 }}
                          >
                            {statusOptions.map((opt) => (
                              <Option key={opt.value} value={opt.value}>
                                <Tag icon={opt.icon} color={opt.color}>
                                  {opt.label}
                                </Tag>
                              </Option>
                            ))}
                          </Select>
                        ) : (
                          <Tag icon={statusMeta?.icon} color={statusMeta?.color}>
                            {statusMeta?.label}
                          </Tag>
                        )}
                      </Space>
                    }
                  />
                </List.Item>
              );
            }}
          />
        )}
      </Card>
    </div>
  );
};

export default DailyCollectionReport;
