import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UserService } from '../../../../core/services/user.service';
import { LogService } from '../../../../core/services/utility/log.service';
import { LogLevel } from '../../../../domain/utility/log-level';
import { LoginService } from '../../../../core/services/login.service';

@Component({
	selector: 'app-home',
	templateUrl: 'home.page.html',
	styleUrls: ['home.page.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomePage {
	constructor(
		private readonly logger: LogService,
		private readonly loginService: LoginService,
		private readonly userService: UserService
	) {
		this.userService.getUser$().subscribe((user) => {
			if (user) {
				this.logger.log(LogLevel.trace, `Is logged in.`);
			} else {
				this.logger.log(LogLevel.trace, `Is not logged in.`);
				this.loginService.initLogin();
			}
		});
	}
}
