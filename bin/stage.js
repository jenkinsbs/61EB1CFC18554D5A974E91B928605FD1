import path from 'path';
import fs from 'fs-extra';

function rmdir(dir) {

  if(!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    return;
  }

  var list = fs.readdirSync(dir);
  for(var i = 0; i < list.length; i++) {
      var filename = path.join(dir, list[i]);
      var stat = fs.statSync(filename);
    if(filename == '.' || filename == '..') {
      continue;
    } else if(stat.isDirectory()) {
      rmdir(filename);
    } else {
      fs.unlinkSync(filename);
    }
  }
  fs.rmdirSync(dir);
}

function mkdir(dir){
  try {
    if(!fs.statSync(dir).isDirectory()) {
      throw new Error(dir + ' exists and is not a directory');
    }
  } catch (err) {
    fs.mkdirSync(dir);
  }
}

rmdir(path.resolve(__dirname, '../stage'));
mkdir(path.resolve(__dirname, '../stage'));

fs.copySync(
  path.resolve(__dirname, '../app/resources/package.json'),
  path.resolve(__dirname, '../stage/package.json')
);

fs.copySync(
  path.resolve(__dirname, '../app/lib'),
  path.resolve(__dirname, '../stage')
);
