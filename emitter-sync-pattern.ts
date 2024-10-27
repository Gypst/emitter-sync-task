/* Check the comments first */

import { EventEmitter } from "./emitter";
import { EventDelayedRepository } from "./event-repository";
import { EventStatistics } from "./event-statistics";
import { ResultsTester } from "./results-tester";
import { triggerRandomly } from "./utils";

const MAX_EVENTS = 1000;

enum EventName {
  EventA = "A",
  EventB = "B",
}

const EVENT_NAMES = [EventName.EventA, EventName.EventB];

/*

  An initial configuration for this case

*/

function init() {
  const emitter = new EventEmitter<EventName>();

  triggerRandomly(() => emitter.emit(EventName.EventA), MAX_EVENTS);
  triggerRandomly(() => emitter.emit(EventName.EventB), MAX_EVENTS);

  const repository = new EventRepository();
  const handler = new EventHandler(emitter, repository);

  const resultsTester = new ResultsTester({
    eventNames: EVENT_NAMES,
    emitter,
    handler,
    repository,
  });
  resultsTester.showStats(20);
}

/* Please do not change the code above this line */
/* ----–––––––––––––––––––––––––––––––––––––---- */

/*

  The implementation of EventHandler and EventRepository is up to you.
  Main idea is to subscribe to EventEmitter, save it in local stats
  along with syncing with EventRepository.

*/

class EventHandler extends EventStatistics<EventName> {
  // Feel free to edit this class

  repository: EventRepository;
  localStatsMap: Map<EventName, number>;

  constructor(emitter: EventEmitter<EventName>, repository: EventRepository) {
    super();
    this.repository = repository;
    this.localStatsMap = new Map();

    Object.values(EventName).forEach((event) => {
      this.localStatsMap.set(event, 0);

      emitter.subscribe(event, () => {
        let localEventCount = this.localStatsMap.get(event)! + 1;
        this.localStatsMap.set(event, localEventCount);
        this.setStats(event, localEventCount);

        this.repository.saveEventData(event, 1);
      });

      emitter.unsubscribe(event, () => this.localStatsMap.set(event, 0));
    });
  }
}

class EventRepository extends EventDelayedRepository<EventName> {
  // Feel free to edit this class

  missedCallsCount: Map<EventName, number>;

  constructor() {
    super();
    this.missedCallsCount = new Map();
  }

  async saveEventData(eventName: EventName, eventCountIncrease: number) {
    const missedIncrement = this.missedCallsCount.get(eventName) ?? 0;
    // console.log(`get event ${eventName}, missed = ${missedIncrement}`);

    try {
      await this.updateEventStatsBy(
        eventName,
        eventCountIncrease + missedIncrement
      );
      this.missedCallsCount.set(eventName, 0);
      // console.log(`all good ${eventName}, missed = 0`);
    } catch (e) {
      this.missedCallsCount.set(eventName, missedIncrement + 1);
      // console.warn(
      //   `${eventName} has error :${e}; Missed = ${missedIncrement + 1}`
      // );
    }
  }
}

init();
