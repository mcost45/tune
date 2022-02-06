import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LoginFailedPage } from './login-failed.page';

const routes: Routes = [
	{
		path: '',
		component: LoginFailedPage
	}
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule]
})
export class LoginFailedPageRoutingModule {}
