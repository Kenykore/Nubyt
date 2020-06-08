'use strict';
require("dotenv").config();
const fetch = require("node-fetch");
const moment = require("moment");
const config = require("./../config/index");
const crypto = require("crypto");
const User = require("../models/users")
/** General utility functions used across the project */
const UtilityFunction = {
    /**
     * Helper function to string pad - add 00000 to the beginning of a number
     * @param   {number}  number  number to left pad - 000001
     * @return  {string}       padded string
     */
    addLeadingZeros(number) {
        return ('00000' + number).slice(-5);
    },
    /**
 * generates a random string     
 * @param   {number}  length  [length of string to be generated]     
 * @return  {string}          [generated random string]
 */
    randomNumber(length) {
        return Math.floor(Math.pow(10, length - 1) + Math.random() * (Math.pow(10, length) - Math.pow(10, length - 1) - 1));
    },

    /**
     * Helper function to convert a vessel acceptance status into human readable format     
     * @param   {number}  status  vessel acceptance status
     * @return  {string}          human readable status
     */
    interpretVesselAcceptanceStatus(status) {
        if (status == 1) {
            return "Accepted";
        } else if (status == 2) {
            return "Rejected";
        } else {
            return "Not yet reviewed";
        }
    },

    /**
     * Helper Function to retrieve user details from our auth service     
     * @param   {String}  user_id  id of user to fetch
     * @param   {String}  key      specify field to return    
     * @return  {Object}           user details object
     */
    async getUserDetails(user_id, key = null) {
        try {
            const user = await User.findById(user_id).select("-password -resetPasswordToken").lean();
            console.log(user,"user")
            if (user) {
                if (key === null) return user
                return user[`${key}`];
            }
            return {};
        } catch (error) {
            console.log("Error fetching user details", error);
        }
    },
 
    async getUserAnalytics() {
        try {
            const user_auth_url = config.user_auth_url;
            const response = await fetch(`${user_auth_url}/analytics`);
            const json = await response.json();
            if (json) {
                return json
            }
            return {};
        } catch (error) {
            console.log("Error fetching user details", error);
        }
    },
    /**
     * Helper Function to retrieve the total number of users filtered by user category     
     * @param   {String}  type  user category to be counted
     * @return  {Object}        user count object
     */
    async getUsersCountByType(type) {
        try {
            const user_auth_url = config.user_auth_url;
            const response = await fetch(`${user_auth_url}/users/type?usertype=${type}`);
            const json = await response.json();
            return json.userCount;
        } catch (error) {
            console.log("Error fetching user details", error);
        }
    },

    /**
     * Helper function to retrieve the combined notification settings and channels of a user
     * @param   {Number}  user_id  user_id of user
     * @return  {Object}        Object of user notifications settings and channels
     */
    async getUserNotificationSettingChannel(user_id) {
        try {
            const user_auth_url = config.user_auth_url;
            const response = await fetch(`${user_auth_url}/settings/notification/all/${user_id}`);
            const json = await response.json();
            return json;
        } catch (error) {
            console.log("Error fetching user notification channels", error);
        }
    },

    /**
     * Helper function used in calculating the difference of two dates     
     * @param   {String}  from        start date
     * @param   {String}  to          end date
     * @param   {String}  dateFormat  date format of both the start and end date
     * @return  {Number}              difference of the two dates
     */
    getDateDifference(from, to, dateFormat) {
        if (!from || !to) {
            return 0
        }
        const dateStart = moment(from, dateFormat);
        const dateEnd = moment(to, dateFormat);
        const result = dateEnd.diff(dateStart, 'days');
        return result;
    },
    formatPhoneNumber(data) {
        // let new_number = 0;
        // let phone = data.replace(/\s/g, "");

        // const characterLength = phone.length;

        // if (characterLength === 10) {
        //     new_number = `+234${phone}`;
        // } else if (characterLength === 11) {
        //     new_number = phone.replace("0", "+234");
        // } else if ((characterLength === 13)) {
        //     new_number = `+${phone}`;
        // } else if (characterLength === 14) {
        //     new_number = phone;
        // }
        return data;
    },
    formatCharterColor(status) {
        if (status === "Matched") {
            return "#00ff00"
        }
        else if (status = "Cold") {
            return "#eeeeee"
        }
        else if (status === "Hot") {
            return "#FF0000"
        }
        else if (status === "Warm") {
            return "#FFFF00"
        }
        else {
            return "#00000"
        }
    },
    /**
     * Helper function to calculate the charter days     
     * @param   {Boolean}  hasEnded      Boolean value to determine if a charter has ended
     * @param   {String}  start_date    Start date
     * @param   {String}  end_date      End date
     * @param   {Number}  charter_days  Total number of charter days
     * @return  {Number}                Charter days
     */
    calculateCharterDays(hasEnded, start_date, end_date, charter_days) {
        const today = moment().format("YYYY-MM-DD");
        if (hasEnded || (end_date ? today >= end_date : false)) {
            return charter_days; // Ended
        } else {
            if (today < start_date) {
                return 0; // Not started
            } else {
                return UtilityFunction.getDateDifference(start_date, today, "YYYY-MM-DD");
            }
        }
    },
    /**
     * [calculateTotalCharterDays description]
     *
     * @param   {Number}  hasEnded      if charter has ended
     * @param   {Date}  start_date    start date of charter
     * @param   {Date}  end_date      end date of charter
     * @param   {Number}  charter_days  number of charter days
     *
     * @return  {Number}                return charter days
     */
    calculateTotalCharterDays(hasEnded, start_date, end_date, charter_days) {
        return UtilityFunction.getDateDifference(start_date, end_date, "YYYY-MM-DD");
    },
    mapUserData(data) {
        console.log(data, "data")
        return data.map(user => ({
            id: user.id,
            name: user.name,
            company_name: user.company_name,
            email: user.email,
            phone: user.mobile,
            verified: user.verified,
            enabled: user.enabled,
            created_at: moment.unix(user.createdat).format("YYYY-MM-DD")
        }));
    },
    /**
     * Function to retrieve users manager from our auth service
     * @param   {String}  user_id  id of user whose manager is been gotten
     * @return  {Object}           user manager details
     */
    async getUserManager(user_id) {
        try {
            const user_auth_url = config.user_auth_url;
            const response = await fetch(`${user_auth_url}/users/user_manager/${user_id}`);
            const json = await response.json();
            return json.data;
        } catch (error) {
            console.log("Error fetching user manager", error);
        }
    },
    getNextSchedulePayment(frequency) {
        try {
            if(frequency.mode==='none'){
                return moment(Date.now()).format("DD/MM/YYYY")
            }
            if (frequency.mode === 'daily') {
                return moment(Date.now()).add(1, "day").format("DD/MM/YYYY")
            }
            if (frequency.mode === "weekly") {
                let today = moment(Date.now()).get("day")
                console.log(today, "today")
                let schedule_window = _.sortBy(frequency.weekly_window, (o) => {
                    return moment(o.day, "dddd").get("day")
                })
                let next_schedule_day = schedule_window.find(x => moment(x.day, "dddd").get("day") > today)
                console.log(moment().day(next_schedule_day.day).format("DD/MM/YYYY"), "next date")
                if(next_schedule_day){
                    return moment().day(next_schedule_day.day).format("DD/MM/YYYY")
                }
                else{
                    return moment().day(schedule_window[0].day).format("DD/MM/YYYY")
                }
             
            }
            if (frequency.mode === "bi-weekly") {
                let today = moment(Date.now()).get("day")
                console.log(today, "today")
                let schedule_window = _.sortBy(frequency.weekly_window, (o) => {
                    return moment(o.day, "dddd").get("day")
                })
                let next_schedule_day = schedule_window.find(x => moment(x.day, "dddd").get("day") > today)
                console.log(moment().day(next_schedule_day.day).format("DD/MM/YYYY"), "next date")
                if(next_schedule_day){
                    return moment().day(next_schedule_day.day).format("DD/MM/YYYY")
                }
                else{
                    return moment(schedule_window[0].day,"dddd").add(2,"weeks").format("DD/MM/YYYY")
                }
             
            }
            if (frequency.mode === "monthly") {
                let today = moment(Date.now()).date()
                console.log(today, "today")
                let schedule_window = _.sortBy(frequency.monthly_window, (o) => {
                    return Number(moment(o.day, "DD").format("D"))
                })
                let next_schedule_day = schedule_window.find(x => moment(x.day, "DD").get("date") > today)
                console.log(moment().date(next_schedule_day.day).format("DD/MM/YYYY"), "next date")
                if(next_schedule_day){
                    return moment().date(next_schedule_day.day).format("DD/MM/YYYY")
                }
                else{
                    return moment().date(schedule_window[0].day).add(1,"month").format("DD/MM/YYYY")
                }
            }
        } catch (error) {
            console.log(error)
        }
    },
    getNextScheduleDate(frequency) {
        try {
            if(frequency.mode==='none'){
                return moment(Date.now()).format("DD/MM/YYYY")
            }
            if (frequency.mode === 'daily') {
                return moment(Date.now()).add(1, "day").format("DD/MM/YYYY")
            }
            if (frequency.mode === "weekly") {
                let today = moment(Date.now()).get("day")
                console.log(today, "today")
                let schedule_window = _.sortBy(frequency.weekly_window, (o) => {
                    return moment(o.day, "dddd").get("day")
                })
                let next_schedule_day = schedule_window.find(x => moment(x.day, "dddd").get("day") > today)
                console.log(moment().day(next_schedule_day.day).format("DD/MM/YYYY"), "next date")
                if(next_schedule_day){
                    return moment().day(next_schedule_day.day).format("DD/MM/YYYY")
                }
                else{
                    return moment().day(schedule_window[0].day).format("DD/MM/YYYY")
                }
            }
            if (frequency.mode === "bi-weekly") {
                let today = moment(Date.now()).get("day")
                console.log(today, "today")
                let schedule_window = _.sortBy(frequency.weekly_window, (o) => {
                    return moment(o.day, "dddd").get("day")
                })
                let next_schedule_day = schedule_window.find(x => moment(x.day, "dddd").get("day") > today)
                console.log(moment().day(next_schedule_day.day).format("DD/MM/YYYY"), "next date")
                if(next_schedule_day){
                    return moment().day(next_schedule_day.day).format("DD/MM/YYYY")
                }
                else{
                    return moment(schedule_window[0].day,"dddd").add(2,"weeks").format("DD/MM/YYYY")
                }
             
            }
            if (frequency.mode === "monthly") {
                let today = moment(Date.now()).get("day")
                console.log(today, "today")
                let schedule_window = _.sortBy(frequency.monthly_window, (o) => {
                    return moment(o.day, "DD").get("day")
                })
                let next_schedule_day = schedule_window.find(x => moment(x.day, "DD").get("day") > today)
                console.log(moment().day(next_schedule_day.day).format("DD/MM/YYYY"), "next date")
                return moment().day(next_schedule_day.day).format("DD/MM/YYYY")
            }
        } catch (error) {
            console.log(error)
        }
    },
    getTimeWindow(frequency) {
        try {
            if (frequency.mode === 'daily') {
                return frequency.daily_window
            }
            else if (frequency.mode === 'weekly') {
                return frequency.weekly_window
            }
            else if (frequency.mode === 'bi-weekly') {
                return frequency.weekly_window
            }
            else if (frequency.mode === 'monthly') {
                return frequency.monthly_window
            }
            else if (frequency.mode === 'none') {
                return frequency.single_window
            }
            else return {
                from: "N/A",
                to: "N/A"
            }
        } catch (error) {
            console.log(error)
        }
    }
}

module.exports = UtilityFunction;