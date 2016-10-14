/**
 * 工具类
 */
/**
 * 保留几位小数
 */
function decimals(number, figures){
    return parseFloat(number.toFixed(figures));
}

/**
 * 获取从startTime到某endTime的整月数
 * 参数支持时间戳 或 yyyy-MM-dd HH:mm:ss格式的字符串
 */
function getMonthBetween(startTime, endTime){
    var start = toDate(startTime);
    var end = toDate(endTime);
    var monthBetween = end.getYear()*12 + end.getMonth() - (start.getYear()*12+start.getMonth());
    if(end.getDate() < start.getDate()){ //比较生日和当时日期在某月的日期，如果当前日期<生日日期，则减去一个月。
        monthBetween--;
    }
    return monthBetween;
}
/**
 * 距离现在几个月
 */
function getMonthToNow(startTime){
    return getMonthBetween(startTime, new Date());
}
/**
 * 转换为字符串的形式   *年*个月
 */
function getAge(birthday, endTime){
    var monthBetween = getMonthBetween(birthday, endTime);
    var year = parseInt(monthBetween / 12);
    var month = monthBetween - year * 12;
    return year+"年"+month+"个月";
}

/**
 * 转换成date对象
 * 支持时间戳 或 yyyy-MM-dd HH:mm:ss格式的字符串  或 date对象
 */
function toDate(time){
    var date;
    if(typeof(time) == "number"){
        date = new Date(time);
    }else if(typeof(time) == "string"){
        date = new Date(Date.parse(time.replace(/-/g,   "/")));
    }else{
        date = time;
    }
    return date;
}