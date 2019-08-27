// See: http://expressjs.com/en/advanced/best-practice-performance.html#use-promises
const wrapAsync = (fn) => (...args) => fn(...args).catch(args[args.length - 1]);

module.exports = wrapAsync;
