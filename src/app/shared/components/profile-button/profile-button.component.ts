import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { LoginService } from '../../../core/services/login.service';

@Component({
	selector: 'app-profile-button',
	templateUrl: './profile-button.component.html',
	styleUrls: ['./profile-button.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileButtonComponent {
	@Input() user$?: Observable<SpotifyApi.CurrentUsersProfileResponse | null>;
	@Input() imageUrl$?: Observable<string | null>;
	@Input() triggerId?: string;

	constructor(private readonly loginService: LoginService) {}

	async onLogin(): Promise<void> {
		await this.loginService.initLogin();
	}
}
