import {createTagRepeat, optimizeTemplateHTML} from '../../lib/utils.js';

const daysTemplate = optimizeTemplateHTML(`<div class="days w-full">
  <div class="days-of-week grid grid-cols-7 mb-5">${createTagRepeat("span", 7, {
    class:
      "dow block flex-1 leading-9 border-0 rounded-lg cursor-default text-center text-gray-900 font-semibold text-sm",
  })}</div>
  <div class="datepicker-grid w-full grid grid-cols-7">${createTagRepeat(
    "div",
    42,
    {
      class:
        "block flex-1 leading-9 border-0 rounded-lg cursor-default text-center text-gray-900 font-semibold text-sm h-6 leading-6 text-sm font-medium text-gray-500 dark:text-gray-400",
    }
  )}</div>
</div>`);

export default daysTemplate;
