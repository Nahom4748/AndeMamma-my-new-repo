import React, { useEffect, useState } from 'react';
import axios from 'axios';
import moment from 'moment';
import { LeftOutlined, RightOutlined, LoadingOutlined, ShopOutlined, HomeOutlined } from '@ant-design/icons';
import { Spin, Button, Tag } from 'antd';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const WeeklyPlanDisplay = () => {
  const [plansByDay, setPlansByDay] = useState({});
  const [currentWeekStart, setCurrentWeekStart] = useState(moment().startOf('week').add(1, 'day'));
  const [loading, setLoading] = useState(true);
  const [weekStatus, setWeekStatus] = useState('draft');

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const startDate = currentWeekStart.format('YYYY-MM-DD');
        const endDate = currentWeekStart.clone().add(5, 'days').format('YYYY-MM-DD');

        const { data } = await axios.get(
          `http://localhost:5000/api/weekly-plan?start_date=${startDate}&end_date=${endDate}`
        );

        const grouped = groupPlansByDay(data.data || []);
        setPlansByDay(grouped);

        const submitted = data.data.some((plan) => plan.status === 'submitted');
        setWeekStatus(submitted ? 'submitted' : 'draft');
      } catch (error) {
        console.error('Error fetching weekly plans:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [currentWeekStart]);

  const groupPlansByDay = (plans) => {
    const grouped = {};
    daysOfWeek.forEach((day, index) => {
      const date = currentWeekStart.clone().add(index, 'days');
      const dateKey = date.format('YYYY-MM-DD');
      grouped[day] = {
        date: dateKey,
        displayDate: date.format('MMM D'),
        plans: [],
      };
    });

    plans.forEach((plan) => {
      const planDate = moment(plan.plan_date).format('YYYY-MM-DD');
      Object.entries(grouped).forEach(([day, dayData]) => {
        if (dayData.date === planDate) {
          dayData.plans.push({
            id: plan.id,
            company: plan.company_name,
            type: plan.collection_type_name,
            typeId: plan.collection_type_id,
            planDate: plan.plan_date,
          });
        }
      });
    });

    return grouped;
  };

  const handlePrevWeek = () => {
    setCurrentWeekStart((prev) => prev.clone().subtract(1, 'week'));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart((prev) => prev.clone().add(1, 'week'));
  };

  const getWeekRange = () => {
    const start = currentWeekStart.format('MMMM D');
    const end = currentWeekStart.clone().add(5, 'days').format('MMMM D, YYYY');
    return `${start} - ${end}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-6xl mx-auto bg-gray-50 rounded-lg">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 p-4 bg-white rounded-lg shadow-sm">
        <div className="mb-2 md:mb-0">
          <h2 className="text-xl font-semibold text-gray-800">Weekly Collection Plan</h2>
          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-600">{getWeekRange()}</p>
            {weekStatus === 'submitted' && (
              <Tag color="green" className="text-xs">
                Submitted
              </Tag>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            size="small"
            icon={<LeftOutlined />}
            onClick={handlePrevWeek}
            className="border-gray-300"
          />
          <Button
            size="small"
            icon={<RightOutlined />}
            onClick={handleNextWeek}
            className="border-gray-300"
          />
        </div>
      </div>

      {/* Collection Type Legend */}
      <div className="flex gap-4 mb-4 px-2">
        <div className="flex items-center">
          <ShopOutlined className="text-blue-500 mr-1" />
          <span className="text-xs text-gray-600">In-store Collection</span>
        </div>
        <div className="flex items-center">
          <HomeOutlined className="text-green-500 mr-1" />
          <span className="text-xs text-gray-600">Regular Collection</span>
        </div>
      </div>

      {/* Weekly Table */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(plansByDay).map(([day, dayData]) => (
          <div
            key={day}
            className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="p-3 border-b border-gray-100 bg-gray-50">
              <h3 className="text-sm font-medium text-gray-800">{day}</h3>
              <p className="text-xs text-gray-500">{dayData.displayDate}</p>
            </div>

            <div className="divide-y divide-gray-100">
              {dayData.plans.length > 0 ? (
                dayData.plans.map((plan) => (
                  <div
                    key={`${day}-${plan.id}`}
                    className="p-3 flex justify-between items-center"
                  >
                    <div className="flex items-center">
                      {plan.typeId === 1 ? (
                        <ShopOutlined className="text-blue-500 mr-2" />
                      ) : (
                        <HomeOutlined className="text-green-500 mr-2" />
                      )}
                      <span className="text-sm text-gray-800">{plan.company}</span>
                    </div>
                    <Tag 
                      color={plan.typeId === 1 ? 'blue' : 'green'} 
                      className="text-xs"
                    >
                      {plan.type}
                    </Tag>
                  </div>
                ))
              ) : (
                <div className="p-3 text-center text-xs text-gray-400 italic">
                  No collections scheduled
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeeklyPlanDisplay;