import watch from 'node-watch';
import moment from 'moment';
import yaml from 'js-yaml';
import { execSync } from 'child_process';
import fs from 'fs';

const TIMEOUT = 60;

const projects = yaml.load(fs.readFileSync('./projects.yaml'));

const dirPaths = Object.keys(projects).filter(Boolean);

const log = fs.existsSync('./log.yaml')
  ? yaml.load(fs.readFileSync('./log.yaml'))
  : {};

function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function init(obj, path) {
  if (path.length) {
    const key = path.pop();
    if (!obj[key]) obj[key] = {};
    return init(obj[key], path);
  }
  return obj;
}

function clockoff() {
  const { active: project, branch, start, end } = log;

  if (project && branch && start && end) {
    const day = init(
      log,
      [
        'log',
        'year ' + moment(end).format('YYYY'),
        'week ' + moment(end).format('WW'),
        moment(end).format('DD MMMM dddd'),
      ].reverse()
    );

    day.times = {
      ...(day.times || {}),
      [`${moment(start).format('HH:MM')}-${moment(end).format(
        'HH:MM'
      )}`]: `${project}@${branch}`,
    };

    const task = init(day, ['totals', project, branch].reverse());

    if (!task.minutes) task.minutes = 0;
    task.minutes += moment(end).diff(moment(start), 'minutes');

    task.hours = `${pad(Math.floor(task.minutes / 60), 2)}:${pad(
      task.minutes % 60,
      2
    )}`;
  }

  log.active = null;
  log.branch = null;
  log.start = null;
  log.end = null;
}

watch(
  dirPaths,
  {
    recursive: true,
    delay: 1,
    filter(f, skip) {
      if (/\/node_modules/.test(f)) return skip;
      if (/\.git/.test(f)) return skip;
      return /\.(js|jsx|ts|tsx|json|yaml|yml)$/.test(f);
    },
  },
  function (evt, filename) {
    const dirPath = dirPaths.reduce(
      (acc, name) =>
        acc || (new RegExp(`^${name}`).test(filename) && name) || null,
      null
    );

    if (dirPath) {
      const project = projects[dirPath] || dirPath;

      const branch = execSync(`cd ${dirPath} && git branch --show-current`)
        .toString()
        .trim();

      if (log.active && log.branch && log.start && log.end) {
        const age = moment().diff(moment(log.end), 'minutes');
        if (age > TIMEOUT) {
          console.log(
            'Timeout on',
            [log.active, log.branch].join('@'),
            'after',
            age,
            'minutes'
          );
          log.end = moment(log.end)
            .add(age <= TIMEOUT ? age : TIMEOUT, 'minutes')
            .format();
          clockoff();
        } else if (log.active !== project || log.branch !== branch) {
          console.log(
            'Switched projects from',
            [log.active, log.branch].join('@'),
            'to',
            [project, branch].join('@')
          );
          log.end = moment().format();
          clockoff();
        }
      }

      log.active = project;
      log.branch = branch;
      log.start = log.start || moment().format();
      log.end = moment().format();

      fs.writeFileSync(
        './log.yaml',
        yaml.dump(log, { noRefs: true, sortKeys: false })
      );
    }
  }
);
