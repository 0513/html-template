var webpack = require('webpack');
var commonsPlugin = new webpack.optimize.CommonsChunkPlugin('common.js');
var glob = require("glob");
var files = glob.sync("./source/js/**/*.js");
var entry = {};
for(var i = 0; i < files.length; i++){
  var file = files[i];
  //var fileName = file.match(/(?=[^\/]+$).+(?=\.js)/);
  var fileName = file.replace("./source/js","").replace(/.js$/,"");
  entry[fileName] = file;
}
module.exports = {
  entry:entry,
  output: {
    path: __dirname + '/build/js',
    publicPath: "/build/js",
    filename: '[name].js'
  },
  module: {
    loaders: [
      {test: /\.js$/, loaders: ['babel']}
    ]
  }
};