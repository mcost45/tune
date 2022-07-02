import { Injectable, NgZone, OnDestroy } from '@angular/core';
import {
	BehaviorSubject,
	catchError,
	distinctUntilChanged,
	EMPTY,
	filter,
	from,
	interval,
	map,
	NEVER,
	ReplaySubject,
	retry,
	switchMap,
	take,
	takeUntil
} from 'rxjs';
import { tap } from 'rxjs/operators';
import { fromFetch } from 'rxjs/fetch';
import { ConfigService } from '../../shared/services/utility/config.service';
import { LogLevel } from '../../shared/domain/utility/log-level';
import { InteractedService } from '../../shared/services/interacted.service';
import { LogService } from '../../shared/services/utility/log.service';
import { runInZone } from '../../utility/run-in-zone';

declare let unmute: any;

@Injectable()
export class AudioService implements OnDestroy {
	private context?: AudioContext;
	private buffer?: AudioBuffer;
	private source?: AudioBufferSourceNode;
	private gainNode?: GainNode;
	private duration?: number;
	private unmuteHandle?: any;

	private readonly playingS = new BehaviorSubject(false);
	private readonly progressS = new BehaviorSubject(0);
	private readonly destroyedS = new ReplaySubject<boolean>(1);
	private readonly sourceUrlS = new ReplaySubject<string>();

	private readonly audioProgress$ = this.progressS.pipe(runInZone(this.zone));

	constructor(
		private readonly configService: ConfigService,
		private readonly logger: LogService,
		private readonly interactedService: InteractedService,
		private readonly zone: NgZone
	) {
		this.zone.runOutsideAngular(() => {
			this.createObservables();
			this.createContext();
		});
	}

	get progress$() {
		return this.audioProgress$;
	}

	ngOnDestroy() {
		this.cleanUpObservables();
		this.cleanUpContext();
	}

	play() {
		const source = this.source;
		if (source) {
			this.interactedService.hasInteracted$
				.pipe(
					filter((hasInteracted) => hasInteracted),
					take(1),
					tap(() => {
						source.start();
						this.onPlayed();
					}),
					retry(1),
					catchError((e) => {
						this.logger.log(LogLevel.error, e);
						return EMPTY;
					}),
					takeUntil(this.destroyedS)
				)
				.subscribe();
		}
	}

	stop() {
		const source = this.source;
		if (source) {
			source.stop();
			this.onStopped();
		}
		this.source = undefined;
	}

	setSource(url: string) {
		this.stop();
		this.progressS.next(0);
		this.sourceUrlS.next(url);
	}

	private createObservables() {
		const createProgressInterval = (isPlaying: boolean, durationS: number) => {
			const intervalToSecondRatio = 1;
			const intervalMs = 1000 * intervalToSecondRatio;

			return isPlaying
				? interval(intervalMs).pipe(
						map((intervals) => {
							const seconds = (intervals + 1) * intervalToSecondRatio;
							return (seconds / durationS) % 1;
						})
				  )
				: NEVER;
		};

		this.playingS
			.pipe(
				distinctUntilChanged(),
				map((isPlaying) => [this.duration, isPlaying]),
				filter(([audioDurationS]) => audioDurationS !== undefined),
				switchMap(([audioDurationS, isPlaying]) =>
					createProgressInterval(isPlaying as boolean, audioDurationS as number)
				),
				takeUntil(this.destroyedS)
			)
			.subscribe((progress) => this.progressS.next(progress));

		this.sourceUrlS
			.pipe(
				switchMap((url) => fromFetch(url)),
				switchMap((response) => from(response.arrayBuffer())),
				filter((dataBuffer) => !!dataBuffer && !!this.context),
				switchMap((dataBuffer) =>
					from((this.context as AudioContext).decodeAudioData(dataBuffer as ArrayBuffer))
				),
				filter((buffer) => !!buffer),
				takeUntil(this.destroyedS)
			)
			.subscribe((buffer) => {
				this.buffer = buffer as AudioBuffer;
				this.stop();
				this.updateSource();
				this.play();
			});
	}

	private updateSource() {
		const { context, buffer, gainNode } = this;
		const config = this.configService.config.playback;

		if (context && buffer && gainNode) {
			const newSource = (this.source = context.createBufferSource());
			newSource.loop = config.loop;
			newSource.buffer = buffer;
			newSource.connect(gainNode);
			this.duration = buffer.duration;
		}
	}

	private onPlayed() {
		this.playingS.next(true);
	}

	private onStopped() {
		this.playingS.next(false);
	}

	private createContext() {
		const config = this.configService.config.playback;

		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const contextConstructor = AudioContext || webkitAudioContext;
		const context = (this.context = new contextConstructor());

		const gainNode = (this.gainNode = context.createGain());
		gainNode.gain.value = config.volume;
		gainNode.connect(context.destination);

		this.unmuteHandle = unmute(context, config.allowBackground);
	}

	private cleanUpObservables() {
		this.destroyedS.next(true);
		this.destroyedS.complete();
	}

	private cleanUpContext() {
		this.stop();
		this.unmuteHandle.dispose();
		this.context?.close();
		this.context = undefined;
	}
}
