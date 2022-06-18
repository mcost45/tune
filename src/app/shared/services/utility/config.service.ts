import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AppConfig } from '../../domain/utility/app-config';

@Injectable({
	providedIn: 'root'
})
// Provides basic application configuration.
export class ConfigService {
	private appConfig: AppConfig | undefined;

	constructor(private readonly http: HttpClient) {}

	get config(): AppConfig {
		return this.appConfig as AppConfig;
	}

	loadConfig(): Observable<object> {
		return this.http.get<AppConfig>('assets/env.json').pipe(
			tap((config) => {
				this.appConfig = config;
			})
		);
	}
}
