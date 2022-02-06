import { Injectable } from '@angular/core';
import { CanActivate, UrlTree } from '@angular/router';
import { map, Observable, tap } from 'rxjs';
import { UserService } from '../../core/services/user.service';
import { LoginService } from '../../core/services/login.service';

@Injectable({
	providedIn: 'root'
})
export class LoggedInActivateGuard implements CanActivate {
	constructor(
		private readonly userService: UserService,
		private readonly loginService: LoginService
	) {}

	canActivate(): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
		const user$ = this.userService.getUser$();

		return user$.pipe(
			map((user) => !!user),
			tap(async (user) => {
				if (!user) {
					await this.loginService.initLogin();
				}
			})
		);
	}
}
