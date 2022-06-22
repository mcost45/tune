import { Component } from '@angular/core';
import { ConfigService } from '../../services/utility/config.service';

@Component({
	selector: 'app-footer',
	templateUrl: './footer.component.html',
	styleUrls: ['./footer.component.scss']
})
export class FooterComponent {
	repoLink: string;

	constructor(private readonly configService: ConfigService) {
		this.repoLink = this.configService.config.repository.link;
	}
}
