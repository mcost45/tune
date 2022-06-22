import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { filter, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { UserService } from '../../../core/services/user.service';

@Component({
	selector: 'app-header',
	templateUrl: './header.component.html',
	styleUrls: ['./header.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent {
	@Input() titleKey = 'Tune';

	profileTriggerId?: string;

	user$: Observable<SpotifyApi.CurrentUsersProfileResponse | null>;
	imageUrl$: Observable<string | null>;

	constructor(private readonly userService: UserService, private readonly router: Router) {
		this.profileTriggerId = this.router.url + '-trigger';

		this.user$ = userService.getUser$().pipe(filter((user) => !!user));
		this.imageUrl$ = userService.getImageUrl$();
	}
}
