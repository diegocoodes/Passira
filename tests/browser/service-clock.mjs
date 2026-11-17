// Load only in the browser suite's server process. Ordering stays testable
// before opening time without changing the application's availability rules.
const NativeDate = Date;
const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Recife', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new NativeDate());
const offset = NativeDate.parse(`${day}T18:00:00-03:00`) - NativeDate.now();
globalThis.Date = new Proxy(NativeDate, {
  construct(target, args) { return Reflect.construct(target, args.length ? args : [NativeDate.now() + offset]); },
  apply() { return new NativeDate(NativeDate.now() + offset).toString(); },
  get(target, property) { return property === 'now' ? () => NativeDate.now() + offset : Reflect.get(target, property); },
});
