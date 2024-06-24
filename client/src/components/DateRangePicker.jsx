import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const DateRangePicker = ({ startDate, setStartDate, endDate, setEndDate }) => {
    return (
        <div className="date-range-picker">
            <div className="date-picker">
                <label htmlFor="start-date">Start Date</label>
                <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    placeholderText="Select start date"
                />
            </div>
            <div className="date-picker">
                <label htmlFor="end-date">End Date</label>
                <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate}
                    placeholderText="Select end date"
                />
            </div>
        </div>
    );
};

export default DateRangePicker;